<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AppDeviceConfigApi, type AppDeviceConfigParam } from '#/api/payment/device/app-device-config.api';
  import { MchAppInfoApi, type MchAppInfoParam, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message, confirm } = useMessage();

  const formRef = ref();
  const mchNo = ref('');

  const { visible, confirmLoading, title, editable, initFormEditType, handleCancel, formEditType } = useFormEdit();

  const formState = ref<MchAppInfoParam>({
    mchNo: '',
    appName: '',
    status: 'enable',
    defaultApp: false,
  });

  // 编辑场景下记录原始状态, 用于检测"默认应用从启用变为停用"以触发二次确认
  const originalStatus = ref<string>('enable');

  // ===== 收款播报配置(应用级开关, 仅编辑已有应用时展示与保存) =====
  // 当前编辑应用的应用号(设备配置按 appId 读写)
  const currentAppId = ref('');
  const deviceConfig = ref<AppDeviceConfigParam>({
    appId: '',
    broadcastEnable: false,
    printEnable: false,
    templateCode: 'standard',
    storeStrictMatch: false,
  });
  // 设备配置是否已加载(未加载成功时不随主表单保存, 避免用默认值覆盖服务端配置)
  const deviceConfigLoaded = ref(false);

  // 打印版式下拉(内置版式, 首期仅 standard 标准小票, 枚举扩展位)
  const templateOptions = computed(() => [
    { label: $t('payment.device.virtual.appConfig.templateStandard'), value: 'standard' },
  ]);

  /**
   * 加载应用收款播报配置(编辑时回显)
   */
  async function loadDeviceConfig(appId: string) {
    const { data } = await AppDeviceConfigApi.simpleGet(appId);
    deviceConfig.value = {
      appId,
      broadcastEnable: data?.broadcastEnable ?? false,
      printEnable: data?.printEnable ?? false,
      templateCode: data?.templateCode || 'standard',
      storeStrictMatch: data?.storeStrictMatch ?? false,
    };
    deviceConfigLoaded.value = true;
  }

  const statusOptions = computed(() => [
    { label: $t('payment.merchant.app.app.statusEnable'), value: 'enable' },
    { label: $t('payment.merchant.app.app.statusDisabled'), value: 'disabled' },
  ]);

  const formRules = computed(() => ({
    appName: [{ required: true, message: $t('payment.merchant.app.app.validationAppName') }],
    status: [{ required: true, message: $t('payment.merchant.app.app.validationStatus') }],
  }));

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      mchNo: mchNo.value,
      appName: '',
      status: 'enable',
      defaultApp: false,
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show(no: string) {
    mchNo.value = no;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(no: string, record: MchAppInfoResult) {
    mchNo.value = no;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    // 复位设备配置加载标志(上一次编辑会话的痕迹不带入)
    deviceConfigLoaded.value = false;
    try {
      const { data } = await MchAppInfoApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        mchNo: no,
        appName: row.appName,
        status: row.status || 'enable',
        defaultApp: !!row.defaultApp,
      };
      // 记录原始状态, 用于 handleOk 检测停用默认应用
      originalStatus.value = row.status || 'enable';
      // 回显收款播报配置(仅编辑模式; 失败不阻断应用编辑, 保持未加载态不随保存覆盖)
      currentAppId.value = row.appId || record.appId || '';
      if (currentAppId.value) {
        try {
          await loadDeviceConfig(currentAppId.value);
        } catch {
          deviceConfigLoaded.value = false;
        }
      }
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存
   *
   * 默认应用从启用变为停用时弹二次确认(与 MchStoreInfoEdit 对齐):
   * 停用后未传 appId 的下单将因回落默认应用失败而阻断。
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    // 编辑场景: 默认应用从启用变停用, 弹二次确认警告
    if (
      formEditType.value === FormEditType.Edit &&
      formState.value.defaultApp &&
      originalStatus.value === 'enable' &&
      formState.value.status === 'disabled'
    ) {
      const ok = await new Promise<boolean>((resolve) => {
        confirm({
          content: $t('payment.merchant.app.app.confirmDisableDefault'),
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!ok) {
        return;
      }
    }
    confirmLoading.value = true;
    try {
      const payload: MchAppInfoParam = {
        ...formState.value,
        mchNo: mchNo.value,
      };
      if (formEditType.value === FormEditType.Edit) {
        // 默认应用开关变更由后端 update 处理：true 调 setDefault，false 调 clearDefault
        await MchAppInfoApi.update(payload);
        // 收款播报配置随主表单一并保存(加载成功才提交, 避免默认值覆盖服务端配置)
        if (deviceConfigLoaded.value && currentAppId.value) {
          await AppDeviceConfigApi.simpleSave({ ...deviceConfig.value, appId: currentAppId.value });
        }
      } else {
        payload.defaultApp = false;
        await MchAppInfoApi.add(payload);
      }
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="480"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="form-compact"
      >
        <!-- 应用名称 -->
        <a-form-item :label="$t('payment.merchant.app.app.appName')" name="appName">
          <a-input v-model:value="formState.appName" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 状态 -->
        <a-form-item :label="$t('payment.merchant.app.app.status')" name="status">
          <a-select v-model:value="formState.status" :options="statusOptions" />
        </a-form-item>
        <!-- 默认应用（仅编辑时展示） -->
        <a-form-item v-if="editable" :label="$t('payment.merchant.app.app.defaultApp')">
          <a-switch v-model:checked="formState.defaultApp" />
        </a-form-item>
        <!-- 收款播报配置区块（仅编辑已有应用时展示; 应用创建后再配置, 新增态无 appId） -->
        <template v-if="editable">
          <a-divider>{{ $t('payment.device.virtual.appConfig.title') }}</a-divider>
          <a-form-item :label="$t('payment.device.virtual.appConfig.broadcast')">
            <div class="flex items-center gap-2">
              <a-switch v-model:checked="deviceConfig.broadcastEnable" />
              <!-- 播报开关说明 -->
              <span class="text-xs text-muted-foreground">
                {{ $t('payment.device.virtual.appConfig.broadcastHint') }}
              </span>
            </div>
          </a-form-item>
          <a-form-item :label="$t('payment.device.virtual.appConfig.print')">
            <div class="flex items-center gap-2">
              <a-switch v-model:checked="deviceConfig.printEnable" />
              <!-- 打印开关说明 -->
              <span class="text-xs text-muted-foreground">
                {{ $t('payment.device.virtual.appConfig.printHint') }}
              </span>
            </div>
          </a-form-item>
          <a-form-item :label="$t('payment.device.virtual.appConfig.storeStrict')">
            <div class="flex items-center gap-2">
              <a-switch v-model:checked="deviceConfig.storeStrictMatch" />
              <!-- 门店订单严格匹配开关说明 -->
              <span class="text-xs text-muted-foreground">
                {{ $t('payment.device.virtual.appConfig.storeStrictHint') }}
              </span>
            </div>
          </a-form-item>
          <a-form-item :label="$t('payment.device.virtual.appConfig.template')">
            <a-select v-model:value="deviceConfig.templateCode" :options="templateOptions" />
          </a-form-item>
        </template>
      </a-form>
    </a-spin>
  </a-modal>
</template>

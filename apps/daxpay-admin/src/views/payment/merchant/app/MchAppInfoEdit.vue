<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AppDeviceConfigApi } from '#/api/payment/merchant/app-device-config.api';
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

  // 当前编辑应用的 appId(收款播报配置读写用; 新增场景无值)
  const currentAppId = ref('');

  // 收款播报配置(简版: 播报/打印开关 + 门店订单严格匹配 + 内置版式; 仅编辑态展示与保存)
  const deviceConfig = ref<{
    broadcastEnable?: boolean;
    printEnable?: boolean;
    storeStrictMatch?: boolean;
    templateCode?: string;
  }>({
    broadcastEnable: false,
    printEnable: false,
    storeStrictMatch: false,
    templateCode: 'standard',
  });

  // 打印版式下拉(内置枚举, 首期仅标准小票)
  const templateOptions = computed(() => [
    { label: $t('payment.merchant.app.deviceConfig.templateStandard'), value: 'standard' },
  ]);

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
    currentAppId.value = '';
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(no: string, record: MchAppInfoResult) {
    mchNo.value = no;
    currentAppId.value = record.appId || '';
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
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
      await loadDeviceConfig();
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 加载应用收款播报配置(编辑态回填; 查询失败保持默认值不阻断弹窗)
   */
  async function loadDeviceConfig() {
    if (!currentAppId.value) {
      return;
    }
    try {
      const { data } = await AppDeviceConfigApi.getSimpleConfig(currentAppId.value);
      deviceConfig.value = {
        broadcastEnable: !!data?.broadcastEnable,
        printEnable: !!data?.printEnable,
        storeStrictMatch: !!data?.storeStrictMatch,
        templateCode: data?.templateCode || 'standard',
      };
    } catch {
      // 静默降级: 未配置过时后端可能返回空, 保持默认值即可
      deviceConfig.value = {
        broadcastEnable: false,
        printEnable: false,
        storeStrictMatch: false,
        templateCode: 'standard',
      };
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
        // 同步保存收款播报配置(编辑态区块; 应用信息保存成功后再保存, 失败提示由全局处理器兜底)
        if (currentAppId.value) {
          await AppDeviceConfigApi.saveSimple({
            appId: currentAppId.value,
            broadcastEnable: deviceConfig.value.broadcastEnable,
            printEnable: deviceConfig.value.printEnable,
            storeStrictMatch: deviceConfig.value.storeStrictMatch,
            templateCode: deviceConfig.value.templateCode,
          });
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

        <!-- 收款播报配置区块（仅编辑时展示; 播报/打印/门店严格匹配三开关+内置版式, 虚拟设备 APP 播报打印联动） -->
        <template v-if="editable">
          <a-divider class="!my-4">{{ $t('payment.merchant.app.deviceConfig.title') }}</a-divider>
          <div class="mb-2 text-xs text-muted-foreground">
            {{ $t('payment.merchant.app.deviceConfig.titleDesc') }}
          </div>
          <!-- 语音播报开关 -->
          <a-form-item :label="$t('payment.merchant.app.deviceConfig.broadcastEnable')">
            <a-switch v-model:checked="deviceConfig.broadcastEnable" />
          </a-form-item>
          <!-- 小票打印开关 -->
          <a-form-item :label="$t('payment.merchant.app.deviceConfig.printEnable')">
            <a-switch v-model:checked="deviceConfig.printEnable" />
          </a-form-item>
          <!-- 门店订单严格匹配开关 -->
          <a-form-item :label="$t('payment.merchant.app.deviceConfig.storeStrict')">
            <div class="flex flex-col gap-1">
              <a-switch v-model:checked="deviceConfig.storeStrictMatch" />
              <span class="text-xs text-muted-foreground">
                {{ $t('payment.merchant.app.deviceConfig.storeStrictHint') }}
              </span>
            </div>
          </a-form-item>
          <!-- 打印版式（内置枚举） -->
          <a-form-item :label="$t('payment.merchant.app.deviceConfig.templateCode')">
            <a-select v-model:value="deviceConfig.templateCode" :options="templateOptions" />
          </a-form-item>
        </template>
      </a-form>
    </a-spin>
  </a-modal>
</template>

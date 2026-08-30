<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type DeviceQrCodeAllocWarningResult,
    DeviceQrCodeApi,
    type DeviceQrCodeParam,
    type DeviceQrCodeResult,
  } from '#/api/payment/device/qrcode.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel } = useFormEdit();

  // 落地程序类型只读(创建后不可改)
  const editProgramType = ref('h5');
  // 分账能力预警清单(开启分账时提示将降级的扫码场景, 不阻断保存)
  const allocWarnings = ref<DeviceQrCodeAllocWarningResult[]>([]);

  // 归属设置: 应用/门店下拉(可清空; 空=支付时走默认应用/默认门店)
  const appOptions = ref<{ label: string; value: string }[]>([]);
  const storeOptions = ref<{ label: string; value: string }[]>([]);
  // 打开时记录原归属, 提交时 diff 决定 bind/unbind
  const originalAppId = ref<string>();
  const originalStoreNo = ref<string>();
  const bindAppId = ref<string>();
  const bindStoreNo = ref<string>();

  const formState = ref<DeviceQrCodeParam>({
    name: '',
    amountType: 'random',
  });

  // 金额类型为固定时, 固定金额必填
  const isFixedAmount = computed(() => formState.value.amountType === 'fixed');

  // formState.fixedAmount 以「元」存储, 提交时再×100转分
  const formRules = computed(() => {
    const rules: Record<string, any[]> = {
      name: [{ required: true, message: $t('payment.device.qrcode.validateName') }],
      amountType: [{ required: true, message: $t('payment.device.qrcode.validateAmountType') }],
    };
    if (isFixedAmount.value) {
      rules.fixedAmount = [
        { required: true, message: $t('payment.device.qrcode.validateFixedAmount') },
        {
          type: 'number',
          min: 0.01,
          message: $t('payment.device.qrcode.validateFixedAmount'),
        },
      ];
    }
    return rules;
  });

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      name: '',
      amountType: 'random',
      fixedAmount: undefined,
      allocation: false,
    };
    editProgramType.value = 'h5';
    allocWarnings.value = [];
    originalAppId.value = undefined;
    originalStoreNo.value = undefined;
    bindAppId.value = undefined;
    bindStoreNo.value = undefined;
    formRef.value?.resetFields();
  }

  /**
   * 加载应用下拉(当前商户启用应用, 无需传 mchNo)
   */
  async function loadAppOptions() {
    const { data } = await MchAppInfoApi.enableList();
    appOptions.value = (data || []).map((item) => ({
      label: item.appName ? `${item.appName} (${item.appId})` : item.appId!,
      value: item.appId!,
    }));
  }

  /**
   * 加载门店下拉(当前商户门店, 后端按上下文隔离)
   */
  async function loadStoreOptions() {
    const { data } = await MchStoreInfoApi.page({ current: 1, size: 200 });
    storeOptions.value = (data?.records || []).map((item) => ({
      label: item.storeName ? `${item.storeName} (${item.storeNo})` : item.storeNo!,
      value: item.storeNo!,
    }));
  }

  /**
   * 打开编辑弹窗(归属可调整: 应用/门店)
   */
  async function showEdit(record: DeviceQrCodeResult) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const [{ data }, ,] = await Promise.all([DeviceQrCodeApi.get(record.id!), loadAppOptions(), loadStoreOptions()]);
      const row = data || record;
      formState.value = {
        id: row.id!,
        name: row.name,
        amountType: row.amountType,
        // 分转元展示
        fixedAmount: row.fixedAmount ? row.fixedAmount / 100 : undefined,
        allocation: row.allocation ?? false,
        remark: row.remark,
      };
      // 类型只读展示, 不参与提交
      editProgramType.value = row.programType || 'h5';
      originalAppId.value = row.appId || undefined;
      originalStoreNo.value = row.storeNo || undefined;
      bindAppId.value = originalAppId.value;
      bindStoreNo.value = originalStoreNo.value;
      // 已开启分账时预检能力(预警不阻断)
      if (formState.value.allocation) {
        await loadAllocWarning();
      }
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 加载分账能力预警(开启分账时提示将降级的扫码场景, 失败不阻断编辑; 应用跟随归属设置当前选择)
   */
  async function loadAllocWarning() {
    try {
      const { data } = await DeviceQrCodeApi.allocCapabilityWarning(bindAppId.value);
      allocWarnings.value = data || [];
    } catch {
      allocWarnings.value = [];
    }
  }

  /**
   * 分账开关切换: 开启时预检能力, 关闭清空预警
   */
  function handleAllocChange(checked: any) {
    if (checked) {
      loadAllocWarning();
    } else {
      allocWarnings.value = [];
    }
  }

  /**
   * 应用切换: 重新预检分账能力(不同应用路由出的产品可能不同)
   */
  function handleAppChange() {
    if (formState.value.allocation) {
      loadAllocWarning();
    }
  }

  /**
   * 保存: 基础字段走 update, 应用/门店归属变化时 diff 调 bind/unbind
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示
      return;
    }
    confirmLoading.value = true;
    try {
      // 金额元转分, 在构造时一次性赋值避免对对象立即修改
      const payload: DeviceQrCodeParam = {
        id: formState.value.id,
        name: formState.value.name,
        amountType: formState.value.amountType,
        fixedAmount:
          isFixedAmount.value && formState.value.fixedAmount
            ? Math.round(formState.value.fixedAmount * 100)
            : undefined,
        allocation: formState.value.allocation ?? false,
        remark: formState.value.remark,
      };
      await DeviceQrCodeApi.update(payload);
      // 应用归属变化: 有值绑定 / 由有值清空则解绑
      const appId = bindAppId.value || undefined;
      if (appId && appId !== originalAppId.value) {
        await DeviceQrCodeApi.bindApp({ ids: [formState.value.id!], appId });
      } else if (!appId && originalAppId.value) {
        await DeviceQrCodeApi.unbindApp([formState.value.id!]);
      }
      // 门店归属变化
      const storeNo = bindStoreNo.value || undefined;
      if (storeNo && storeNo !== originalStoreNo.value) {
        await DeviceQrCodeApi.bindStore({ ids: [formState.value.id!], storeNo });
      } else if (!storeNo && originalStoreNo.value) {
        await DeviceQrCodeApi.unbindStore([formState.value.id!]);
      }
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  // import 放最后避免循环依赖(参照项目惯例)
  defineExpose({ showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="640"
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
        <!-- 码牌类型只读(创建后不可改) -->
        <a-form-item :label="$t('payment.device.qrcode.field.programType')">
          <a-tag v-if="editProgramType === 'mini_app'" color="purple">
            {{ $t('payment.device.qrcode.programType.mini_app') }}
          </a-tag>
          <a-tag v-else color="blue">
            {{ $t('payment.device.qrcode.programType.h5') }}
          </a-tag>
        </a-form-item>
        <!-- 分账开关: 开启后扫码支付向下单链路透传分账标识; 产品不支持时下单自动降级普通收款 -->
        <a-form-item :label="$t('payment.device.qrcode.field.allocation')">
          <a-switch v-model:checked="formState.allocation" @change="handleAllocChange" />
          <span class="ml-2 text-xs text-muted-foreground">{{ $t('payment.device.qrcode.allocationTip') }}</span>
        </a-form-item>
        <!-- 分账能力预警(不阻断, 仅提示将降级的场景) -->
        <div v-if="formState.allocation && allocWarnings.length > 0" class="mb-4">
          <a-alert type="warning" show-icon>
            <template #message>{{ $t('payment.device.qrcode.allocWarningTitle') }}</template>
            <template #description>
              <div>{{ $t('payment.device.qrcode.allocWarningDesc') }}</div>
              <div v-for="(w, i) in allocWarnings" :key="i" class="mt-1">
                ·
                {{ $t(`payment.device.qrcode.clientEnv.${w.clientEnv}`) }}
                {{ $t(`payment.device.qrcode.payForm.${w.payForm}`) }}
                ({{ w.product }})
              </div>
            </template>
          </a-alert>
        </div>
        <!-- 码牌名称 -->
        <a-form-item :label="$t('payment.device.qrcode.field.name')" name="name">
          <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 金额类型 -->
        <a-form-item :label="$t('payment.device.qrcode.field.amountType')" name="amountType">
          <a-radio-group v-model:value="formState.amountType" button-style="solid">
            <a-radio-button value="random">{{ $t('payment.device.qrcode.amountType.random') }}</a-radio-button>
            <a-radio-button value="fixed">{{ $t('payment.device.qrcode.amountType.fixed') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 固定金额(仅固定金额类型显示, 表单内以元存储) -->
        <a-form-item v-if="isFixedAmount" :label="$t('payment.device.qrcode.field.fixedAmount')" name="fixedAmount">
          <a-input-number
            v-model:value="formState.fixedAmount"
            :min="0.01"
            :step="0.01"
            :precision="2"
            style="width: 100%"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
        <!-- 归属设置: 应用(空=支付时走默认应用) -->
        <a-form-item :label="$t('payment.device.qrcode.field.appId')">
          <a-select
            v-model:value="bindAppId"
            :options="appOptions"
            :placeholder="$t('payment.device.qrcode.pleaseSelectApp')"
            allow-clear
            show-search
            option-filter-prop="label"
            @change="handleAppChange"
          />
        </a-form-item>
        <!-- 归属设置: 门店(空=默认门店, 支付侧 resolve) -->
        <a-form-item :label="$t('payment.device.qrcode.field.store')">
          <a-select
            v-model:value="bindStoreNo"
            :options="storeOptions"
            :placeholder="$t('payment.device.qrcode.pleaseSelectStore')"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.device.qrcode.field.remark')">
          <a-textarea v-model:value="formState.remark" :rows="2" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

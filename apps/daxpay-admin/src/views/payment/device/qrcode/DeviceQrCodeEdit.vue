<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceQrCodeApi, type DeviceQrCodeParam, type DeviceQrCodeResult } from '#/api/payment/device/qrcode.api';
  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 是否编辑模式(编辑时商户/应用只读展示)
  const isEdit = computed(() => formEditType.value === FormEditType.Edit);

  // 商户下拉选项
  const mchOptions = ref<LabelValue[]>([]);

  // 应用下拉选项(根据商户联动)
  const appOptions = ref<MchAppInfoResult[]>([]);

  const formState = ref<DeviceQrCodeParam>({
    name: '',
    mchNo: '',
    amountType: 'random',
  });

  const formRules = computed(() => {
    const rules: Record<string, any[]> = {
      name: [{ required: true, message: $t('payment.device.qrcode.validateName') }],
      amountType: [{ required: true, message: $t('payment.device.qrcode.validateAmountType') }],
    };
    // 新增时商户必填; 编辑不改归属
    if (!isEdit.value) {
      rules.mchNo = [{ required: true, message: $t('payment.device.qrcode.validateMchNo') }];
    }
    return rules;
  });

  // 金额类型为固定时, 固定金额必填
  const isFixedAmount = computed(() => formState.value.amountType === 'fixed');

  // 固定金额展示值(元), 提交时转回分
  const fixedAmountYuan = ref<number | undefined>(undefined);

  /**
   * 加载商户下拉
   */
  async function loadMchOptions() {
    const { data } = await MerchantApi.dropdown();
    mchOptions.value = data || [];
  }

  /**
   * 商户切换时重新加载应用列表并清空已选应用
   */
  async function handleMchChange() {
    formState.value.appId = undefined;
    appOptions.value = [];
    if (formState.value.mchNo) {
      const { data } = await MchAppInfoApi.page({ mchNo: formState.value.mchNo, size: 999 });
      appOptions.value = data?.records || [];
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      name: '',
      mchNo: '',
      amountType: 'random',
    };
    fixedAmountYuan.value = undefined;
    appOptions.value = [];
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
    loadMchOptions();
  }

  /**
   * 打开编辑弹窗(归属只读)
   */
  async function showEdit(record: DeviceQrCodeResult) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await DeviceQrCodeApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        name: row.name,
        mchNo: row.mchNo,
        appId: row.appId,
        amountType: row.amountType,
        fixedAmount: row.fixedAmount,
        remark: row.remark,
      };
      fixedAmountYuan.value = row.fixedAmount ? row.fixedAmount / 100 : undefined;
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示
      return;
    }
    // 固定金额校验
    if (isFixedAmount.value && (fixedAmountYuan.value === undefined || fixedAmountYuan.value <= 0)) {
      message.error($t('payment.device.qrcode.validateFixedAmount'));
      return;
    }
    confirmLoading.value = true;
    try {
      // 金额元转分, 在构造时一次性赋值避免对对象立即修改
      const payload: DeviceQrCodeParam = {
        ...formState.value,
        fixedAmount: isFixedAmount.value && fixedAmountYuan.value ? Math.round(fixedAmountYuan.value * 100) : undefined,
      };
      await (formEditType.value === FormEditType.Edit ? DeviceQrCodeApi.update(payload) : DeviceQrCodeApi.add(payload));
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  // import 放最后避免循环依赖(参照项目惯例)
  defineExpose({ show, showEdit });
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
        <!-- 新增: 可选商户/应用; 编辑: 只读展示归属 -->
        <a-form-item v-if="!isEdit" :label="$t('payment.device.qrcode.field.mchNo')" name="mchNo">
          <a-select
            v-model:value="formState.mchNo"
            :options="mchOptions"
            :placeholder="$t('payment.device.qrcode.pleaseSelectMch')"
            show-search
            option-filter-prop="label"
            @change="handleMchChange"
          />
        </a-form-item>
        <a-form-item v-if="!isEdit" :label="$t('payment.device.qrcode.field.appId')">
          <a-select
            v-model:value="formState.appId"
            :options="appOptions"
            :field-names="{ label: 'appName', value: 'appId' }"
            :placeholder="$t('payment.device.qrcode.pleaseSelectApp')"
            allow-clear
          />
        </a-form-item>
        <a-form-item v-if="isEdit" :label="$t('payment.device.qrcode.field.mchNo')">
          <a-tag v-if="formState.mchNo" color="blue">{{ formState.mchNo }}</a-tag>
          <a-tag v-else color="default">{{ $t('payment.device.qrcode.unbound') }}</a-tag>
        </a-form-item>
        <a-form-item v-if="isEdit" :label="$t('payment.device.qrcode.field.appId')">
          <a-tag v-if="formState.appId" color="cyan">{{ formState.appId }}</a-tag>
          <span v-else-if="formState.mchNo" style="color: var(--text-color-placeholder)">
            {{ $t('payment.device.qrcode.defaultApp') }}
          </span>
          <span v-else style="color: var(--text-color-placeholder)">-</span>
        </a-form-item>
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
        <!-- 固定金额(仅固定金额类型显示) -->
        <a-form-item v-if="isFixedAmount" :label="$t('payment.device.qrcode.field.fixedAmount')" name="fixedAmount">
          <a-input-number
            v-model:value="fixedAmountYuan"
            :min="0.01"
            :step="0.01"
            :precision="2"
            style="width: 100%"
            :placeholder="$t('common.pleaseInput')"
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

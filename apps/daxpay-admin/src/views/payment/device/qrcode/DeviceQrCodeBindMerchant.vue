<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DeviceQrCodeApi,
    type DeviceQrCodeBindMerchantParam,
  } from '#/api/payment/device/qrcode.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();

  // 待绑定码牌 id
  const ids = ref<string[]>([]);
  // 商户下拉
  const mchOptions = ref<LabelValue[]>([]);

  const formState = ref<{ mchNo?: string }>({
    mchNo: undefined,
  });

  const formRules = computed(() => ({
    mchNo: [{ required: true, message: $t('payment.device.qrcode.validateMchNo') }],
  }));

  /**
   * 加载商户下拉
   */
  async function loadMchOptions() {
    const { data } = await MerchantApi.dropdown();
    mchOptions.value = data || [];
  }

  /**
   * 打开绑定弹窗
   */
  async function show(selectedIds: string[]) {
    ids.value = selectedIds;
    formState.value = { mchNo: undefined };
    formRef.value?.resetFields();
    visible.value = true;
    await loadMchOptions();
  }

  /**
   * 关闭弹窗
   */
  function handleCancel() {
    visible.value = false;
  }

  /**
   * 提交绑定: 不传 appId, 后端 resolveApp 取商户默认应用
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      const payload: DeviceQrCodeBindMerchantParam = {
        ids: ids.value,
        mchNo: formState.value.mchNo!,
      };
      await DeviceQrCodeApi.bindMerchant(payload);
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.device.qrcode.bindMerchant')"
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
        <a-form-item :label="$t('payment.device.qrcode.field.mchNo')" name="mchNo">
          <a-select
            v-model:value="formState.mchNo"
            :options="mchOptions"
            :placeholder="$t('payment.device.qrcode.pleaseSelectMch')"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DeviceQrCodeApi,
    type DeviceQrCodeBindMerchantParam,
  } from '#/api/payment/device/qrcode.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
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
  // 应用下拉(随商户级联, 可空=支付走默认应用)
  const appOptions = ref<LabelValue[]>([]);
  // 门店下拉(随商户级联, 可空)
  const storeOptions = ref<LabelValue[]>([]);

  const formState = ref<{ mchNo?: string; appId?: string; storeNo?: string }>({
    mchNo: undefined,
    appId: undefined,
    storeNo: undefined,
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
   * 按商户加载应用下拉
   */
  async function loadAppOptions(mchNo?: string) {
    appOptions.value = [];
    formState.value.appId = undefined;
    if (!mchNo) {
      return;
    }
    const { data } = await MchAppInfoApi.page({
      mchNo,
      current: 1,
      size: 200,
    });
    appOptions.value = (data?.records || []).map((item) => {
      const base = item.appName
        ? `${item.appName} (${item.appId})`
        : (item.appId as string);
      const label = item.defaultApp
        ? `${base} [${$t('payment.device.qrcode.defaultApp')}]`
        : base;
      return { label, value: item.appId as string };
    });
  }

  /**
   * 按商户加载门店下拉
   */
  async function loadStoreOptions(mchNo?: string) {
    storeOptions.value = [];
    formState.value.storeNo = undefined;
    if (!mchNo) {
      return;
    }
    const { data } = await MchStoreInfoApi.page({
      mchNo,
      current: 1,
      size: 200,
    });
    storeOptions.value = (data?.records || []).map((item) => ({
      label: item.storeName
        ? `${item.storeName} (${item.storeNo})`
        : (item.storeNo as string),
      value: item.storeNo as string,
    }));
  }

  /**
   * 商户变更: 级联刷新应用与门店
   */
  function handleMchChange(value: string) {
    loadAppOptions(value);
    loadStoreOptions(value);
  }

  /**
   * 打开绑定弹窗
   */
  async function show(selectedIds: string[]) {
    ids.value = selectedIds;
    formState.value = { mchNo: undefined, appId: undefined, storeNo: undefined };
    appOptions.value = [];
    storeOptions.value = [];
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
   * 提交绑定: appId/storeNo 均可空(支付时 resolve 默认应用/默认门店)
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
        // 可选应用; 空则落库 null, 支付走默认应用
        appId: formState.value.appId,
        // 可选门店; 空则落库 null
        storeNo: formState.value.storeNo,
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
            @change="handleMchChange"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.appId')" name="appId">
          <a-select
            v-model:value="formState.appId"
            :options="appOptions"
            :placeholder="$t('payment.device.qrcode.pleaseSelectApp')"
            :disabled="!formState.mchNo"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.store')" name="storeNo">
          <a-select
            v-model:value="formState.storeNo"
            :options="storeOptions"
            :placeholder="$t('payment.device.qrcode.pleaseSelectStore')"
            :disabled="!formState.mchNo"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

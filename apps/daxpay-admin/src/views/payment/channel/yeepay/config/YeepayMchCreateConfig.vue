<script lang="ts" setup>
import { ref } from 'vue';

import { $t } from '@vben/locales';

import {
  YeepayChannelMerchantApi,
  type YeepayDirectChannelMerchantCreateParam,
} from '#/api/payment/channel/yeepay/channel-merchant.api';
import { useMessage } from '#/hooks/useMessage';

defineOptions({ name: 'YeepayMchCreateConfig' });

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { message } = useMessage();

const visible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 商户号 / 产品编码(由通用通道商户管理框架注入)
const mchNo = ref('');
const productCode = ref('');

const form = ref<YeepayDirectChannelMerchantCreateParam>({
  mchNo: '',
  channelMerchantName: '',
  product: '',
  merchantNo: '',
  yopIsvNo: '',
});

const rules = {
  channelMerchantName: [
    {
      required: true,
      message: $t('payment.channel.yeepay.validation.channelMerchantName'),
    },
  ],
  merchantNo: [
    {
      required: true,
      message: $t('payment.channel.yeepay.validation.merchantNo'),
    },
  ],
  yopIsvNo: [
    {
      required: true,
      message: $t('payment.channel.yeepay.validation.yopIsvNo'),
    },
  ],
};

/** 由通用框架初始化(传入商户号与产品编码后打开弹窗) */
function init(no: string, product: string) {
  mchNo.value = no;
  productCode.value = product;
  visible.value = true;
  form.value = {
    mchNo: no,
    channelMerchantName: '',
    product,
    merchantNo: '',
    yopIsvNo: '',
  };
}

async function handleSubmit() {
  await formRef.value?.validate();
  submitLoading.value = true;
  try {
    await YeepayChannelMerchantApi.create(form.value);
    message.success($t('payment.channel.yeepay.createSuccess'));
    visible.value = false;
    emit('close');
  } finally {
    submitLoading.value = false;
  }
}

defineExpose({ init });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :cancel-text="$t('common.cancel')"
    :confirm-loading="submitLoading"
    :ok-text="$t('common.confirm')"
    :title="$t('payment.channel.yeepay.basicConfig')"
    @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item
        :label="$t('payment.channel.yeepay.channelMerchantName')"
        name="channelMerchantName"
      >
        <a-input
          v-model:value="form.channelMerchantName"
          :placeholder="$t('payment.channel.yeepay.channelMerchantName')"
        />
      </a-form-item>
      <a-form-item
        :label="$t('payment.channel.yeepay.merchantNo')"
        name="merchantNo"
      >
        <a-input
          v-model:value="form.merchantNo"
          :placeholder="$t('payment.channel.yeepay.merchantNoPlaceholder')"
        />
      </a-form-item>
      <a-form-item
        :label="$t('payment.channel.yeepay.yopIsvNo')"
        name="yopIsvNo"
      >
        <a-input
          v-model:value="form.yopIsvNo"
          :placeholder="$t('payment.channel.yeepay.yopIsvNoPlaceholder')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { $t } from '@vben/locales';

defineOptions({ name: 'ChannelMerchantBaseInfo' });

const channelMchNo = defineModel<string>('channelMchNo', { required: true });
const channelMerchantName = defineModel<string>('channelMerchantName', { required: true });

defineProps<{
  productDisplayName: string;
}>();
</script>

<template>
  <!-- 国际化：通道商户号 -->
  <a-form-item :label="$t('payment.merchant.channelMerchant.channelMerchantNo')" name="channelMchNo">
    <a-input
      v-model:value="channelMchNo"
      :placeholder="$t('payment.merchant.channelMerchant.channelMchNoPlaceholder')"
    />
  </a-form-item>
  <!-- 国际化：商户名称 -->
  <a-form-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')" name="channelMerchantName">
    <a-input
      v-model:value="channelMerchantName"
      :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
    />
  </a-form-item>
  <!-- 国际化：所属支付产品 -->
  <a-form-item :label="$t('payment.merchant.channelMerchant.selectedProduct')">
    <a-input :value="productDisplayName" disabled />
  </a-form-item>
</template>

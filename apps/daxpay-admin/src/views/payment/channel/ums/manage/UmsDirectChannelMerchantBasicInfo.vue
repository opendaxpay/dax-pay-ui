<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import { productI18nMap, productNameMap } from '#/enums/payment';

  defineOptions({ name: 'UmsDirectChannelMerchantBasicInfo' });

  const props = defineProps<{
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
  }>();

  const visible = ref(false);

  const enableLabel = computed(() =>
    props.channelMerchant.enable
      ? $t('payment.merchant.channelMerchant.enableStatus')
      : $t('payment.merchant.channelMerchant.disableStatus'),
  );

  const sourceLabel = computed(() => {
    if (props.channelMerchant.source === 'manual') {
      return $t('payment.merchant.channelMerchant.sourceManual');
    }
    return props.channelMerchant.source || '-';
  });

  // 支付产品展示名称(优先取国际化映射, 兜底产品编码)
  const productDisplayName = computed(() => {
    const product = props.channelMerchant.product;
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  });

  function open() {
    visible.value = true;
  }

  function close() {
    visible.value = false;
  }

  defineExpose({ open, close });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.basicInfoDrawerTitle')"
    :size="640"
    destroy-on-hidden
  >
    <a-descriptions bordered :column="1" size="small">
      <!-- 国际化: 通道商户号 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantNo')">
        {{ channelMerchant.channelMchNo || '-' }}
      </a-descriptions-item>
      <!-- 国际化: 通道商户名称 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')">
        {{ channelMerchant.channelMerchantName || '-' }}
      </a-descriptions-item>
      <!-- 国际化: 所属支付产品 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.selectedProduct')">
        {{ productDisplayName }}
      </a-descriptions-item>
      <!-- 国际化: 是否启用 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.enable')">
        {{ enableLabel }}
      </a-descriptions-item>
      <!-- 国际化: 来源 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.source')">
        {{ sourceLabel }}
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

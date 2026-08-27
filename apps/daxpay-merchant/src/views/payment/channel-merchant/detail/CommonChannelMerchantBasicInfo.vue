<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { productI18nMap, productNameMap } from '#/enums/payment';

  defineOptions({ name: 'CommonChannelMerchantBasicInfo' });

  const props = defineProps<{
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
    /** 通道专属字段列表(由调用方组装) */
    extraFields?: { label: string; value: string }[];
  }>();

  const visible = ref(false);

  /** 支付产品展示名称 */
  const productDisplayName = computed(() => {
    const product = props.channelMerchant.product;
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      // 词条缺失时回退中文名, 避免显示裸 key
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return productNameMap[product] || product;
  });

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

  // 是否显示环境状态(仅支持沙箱的产品)
  const showEnvStatus = computed(() => props.channelMerchant.sandboxSupport === true);

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
      <!-- 国际化: 环境状态 -->
      <a-descriptions-item v-if="showEnvStatus" :label="$t('payment.merchant.channelMerchant.envStatus')">
        <a-tag :color="channelMerchant.sandbox ? 'orange' : 'blue'">
          {{
            channelMerchant.sandbox
              ? $t('payment.merchant.channelMerchant.sandboxLabel')
              : $t('payment.merchant.channelMerchant.prodLabel')
          }}
        </a-tag>
      </a-descriptions-item>
      <!-- 国际化: 来源 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.source')">
        {{ sourceLabel }}
      </a-descriptions-item>
      <a-descriptions-item
        v-for="field in extraFields || []"
        :key="field.label"
        :label="field.label"
      >
        {{ field.value }}
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

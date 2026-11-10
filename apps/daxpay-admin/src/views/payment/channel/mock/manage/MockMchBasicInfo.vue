<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { productI18nMap, productNameMap } from '#/enums/payment';

  /**
   * Mock 模拟通道商户基本信息抽屉(详情工作台「基本信息」磁贴打开)
   *
   * 展示通道商户号/名称/产品/状态/来源/创建时间; 服务商形态归属全局唯一模拟服务商, 不再展示归属服务商行。
   */
  defineOptions({ name: 'MockMchBasicInfo' });

  const props = defineProps<{
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
  }>();

  const visible = ref(false);

  /** 支付产品展示名称(优先国际化映射, 兜底产品编码) */
  const productDisplayName = computed(() => {
    const product = props.channelMerchant.product;
    if (!product) {
      return '-';
    }
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  });

  /** 启用状态文案 */
  const enableLabel = computed(() =>
    props.channelMerchant.enable
      ? $t('payment.merchant.channelMerchant.enableStatus')
      : $t('payment.merchant.channelMerchant.disableStatus'),
  );

  /** 创建来源文案 */
  const sourceLabel = computed(() => {
    if (props.channelMerchant.source === 'manual') {
      return $t('payment.merchant.channelMerchant.sourceManual');
    }
    return props.channelMerchant.source || '-';
  });

  /** 是否展示环境状态(模拟通道恒为沙箱语义) */
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
    :default-size="640"
    resizable
    destroy-on-hidden
  >
    <a-descriptions bordered :column="1" size="small">
      <!-- 国际化: 商户号 -->
      <a-descriptions-item :label="$t('payment.merchant.base.field.mchNo')">
        {{ channelMerchant.mchNo || '-' }}
      </a-descriptions-item>
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
      <!-- 国际化: 启用状态 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.enable')">
        {{ enableLabel }}
      </a-descriptions-item>
      <!-- 国际化: 环境状态(模拟通道恒为沙箱) -->
      <a-descriptions-item v-if="showEnvStatus" :label="$t('payment.merchant.channelMerchant.envStatus')">
        <a-tag :color="channelMerchant.sandbox ? 'orange' : 'blue'">
          {{
            channelMerchant.sandbox
              ? $t('payment.constant.product.productConfig.sandboxLabel')
              : $t('payment.constant.product.productConfig.prodLabel')
          }}
        </a-tag>
      </a-descriptions-item>
      <!-- 国际化: 来源 -->
      <a-descriptions-item :label="$t('payment.merchant.channelMerchant.source')">
        {{ sourceLabel }}
      </a-descriptions-item>
      <!-- 国际化: 创建时间 -->
      <a-descriptions-item :label="$t('common.createTime')">
        {{ formatDateTime(channelMerchant.createTime) || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

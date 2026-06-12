<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import {
  ChannelMerchantAlipayApi,
  type AlipayChannelMerchantConfig,
  type ChannelMerchantResult,
} from '#/api/payment/channelMerchant.api';
import { ProductEnum } from '#/enums/payment/productEnum';

defineOptions({ name: 'AlipayChannelMerchantBasicInfo' });

const props = defineProps<{
  channelMchNo: string;
  channelMerchant: ChannelMerchantResult;
}>();

const visible = ref(false);
const loading = ref(false);
const config = ref<AlipayChannelMerchantConfig>({});

/** 是否为直连产品 */
const isDirectProduct = computed(() => props.channelMerchant.product === ProductEnum.ALIPAY);

/** 是否为服务商产品 */
const isIsvProduct = computed(() => props.channelMerchant.product === ProductEnum.ALIPAY_ISV);

/** 脱敏展示敏感字段 */
function maskSecret(value?: string) {
  if (!value) {
    return '-';
  }
  if (value.length <= 8) {
    return '****';
  }
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

const enableLabel = computed(() =>
  props.channelMerchant.enable
    ? $t('payment.merchant.channelMerchant.enableStatus')
    : $t('payment.merchant.channelMerchant.disableStatus'),
);

const sourceLabel = computed(() => {
  if (props.channelMerchant.source === 'manual') {
    return $t('payment.merchant.channelMerchant.sourceManual');
  }
  if (props.channelMerchant.source === 'apply') {
    return $t('payment.merchant.channelMerchant.sourceApply');
  }
  return props.channelMerchant.source || '-';
});

/** 加载支付宝通道商户配置 */
function loadConfig() {
  if (!props.channelMchNo) {
    return;
  }
  loading.value = true;
  ChannelMerchantAlipayApi.findByChannelMchNo(props.channelMchNo)
    .then(({ data }) => {
      config.value = data || {};
    })
    .finally(() => {
      loading.value = false;
    });
}

function open() {
  visible.value = true;
  loadConfig();
}

function close() {
  visible.value = false;
}

watch(
  () => props.channelMchNo,
  () => {
    if (visible.value) {
      loadConfig();
    }
  },
);

defineExpose({ open, close });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.basicInfoDrawerTitle')"
    :size="640"
    destroy-on-close
  >
    <a-spin :spinning="loading">
      <a-descriptions bordered :column="1" size="small">
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantNo')">
          {{ channelMerchant.channelMchNo || config.channelMchNo || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')">
          {{ channelMerchant.channelMerchantName || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.enable')">
          {{ enableLabel }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.source')">
          {{ sourceLabel }}
        </a-descriptions-item>
        <a-descriptions-item v-if="isDirectProduct" :label="$t('payment.channel.alipay.alipayUserId')">
          {{ config.alipayUserId || '-' }}
        </a-descriptions-item>
        <template v-if="isIsvProduct">
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.alipayIsvApp')">
            {{ config.isvAppId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.alipaySubMerchantNo')">
            {{ config.alipayUserId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.appAuthToken')">
            {{ config.appAuthToken ? maskSecret(config.appAuthToken) : '-' }}
          </a-descriptions-item>
        </template>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

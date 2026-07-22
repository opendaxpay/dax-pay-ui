<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { type AlipayIsvApp, AlipayIsvAppApi } from '#/api/payment/channel/alipay/isv-app.api';
import {
  AlipayDirectChannelMerchantApi,
  AlipayIsvChannelMerchantApi,
  type AlipayDirectChannelMerchantConfig,
  type AlipayIsvChannelMerchantConfig,
} from '#/api/payment/channel/alipay/channel-merchant.api';
import { type ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';
import { ProductEnum } from '#/enums/payment/productEnum';

defineOptions({ name: 'AlipayChannelMerchantBasicInfo' });

const props = defineProps<{
  channelMchNo: string;
  channelMerchant: ChannelMerchantResult;
}>();

const visible = ref(false);
const loading = ref(false);
// 服务商通道商户配置(含 isvAppId / alipayUserId / appAuthToken)
const isvConfig = ref<AlipayIsvChannelMerchantConfig>({});
// 直连通道商户配置(含 alipayUserId)
const directConfig = ref<AlipayDirectChannelMerchantConfig>({});
// 关联的服务商应用详情(用于展示 aliAppId, 让用户能识别对应的应用)
const isvAppInfo = ref<AlipayIsvApp>({});

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
  return props.channelMerchant.source || '-';
});

/**
 * 加载支付宝通道商户配置
 * 按支付产品类型分别调用服务商/直连接口
 */
function loadConfig() {
  if (!props.channelMchNo) {
    return;
  }
  loading.value = true;
  // 重置状态
  isvConfig.value = {};
  directConfig.value = {};
  isvAppInfo.value = {};

  const query = isIsvProduct.value
    ? AlipayIsvChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
    : AlipayDirectChannelMerchantApi.findByChannelMchNo(props.channelMchNo);

  query
    .then(({ data }) => {
      if (isIsvProduct.value) {
        isvConfig.value = data || {};
        // 服务商场景: 查应用详情, 展示 aliAppId 让用户能识别对应应用
        const appId = isvConfig.value.isvAppId;
        if (appId) {
          return AlipayIsvAppApi.findById(appId).then(({ data: appData }) => {
            isvAppInfo.value = appData || {};
          });
        }
      } else {
        directConfig.value = data || {};
      }
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
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <a-descriptions bordered :column="1" size="small">
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantNo')">
          {{ channelMerchant.channelMchNo || '-' }}
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
          {{ directConfig.alipayUserId || '-' }}
        </a-descriptions-item>
        <template v-if="isIsvProduct">
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.alipayIsvApp')">
            {{ isvAppInfo.aliAppId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.alipaySubMerchantNo')">
            {{ isvConfig.alipayUserId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.appAuthToken')">
            {{ isvConfig.appAuthToken ? maskSecret(isvConfig.appAuthToken) : '-' }}
          </a-descriptions-item>
        </template>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

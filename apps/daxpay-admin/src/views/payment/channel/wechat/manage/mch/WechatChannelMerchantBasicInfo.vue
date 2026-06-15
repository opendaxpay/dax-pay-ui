<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import {
  type WechatIsvChannelMerchantConfig,
  WechatIsvChannelMerchantApi,
} from '#/api/payment/channel/wechat/channel-merchant.api';
import { type ChannelMerchantResult } from '#/api/payment/channel/channel-merchant.api';

defineOptions({ name: 'WechatChannelMerchantBasicInfo' });

const props = defineProps<{
  channelMchNo: string;
  channelMerchant: ChannelMerchantResult;
}>();

const visible = ref(false);
const loading = ref(false);
// 服务商通道商户配置(含 subMchId)
const config = ref<WechatIsvChannelMerchantConfig>({});

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

/** 加载微信服务商通道商户配置 */
function loadConfig() {
  if (!props.channelMchNo) {
    return;
  }
  loading.value = true;
  config.value = {};

  WechatIsvChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
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
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.wechatSubMerchantNo')">
          {{ config.subMchId || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import {
  type WechatDirectChannelMerchantConfig,
  type WechatTransferSceneOption,
  WechatDirectChannelMerchantApi,
} from '#/api/payment/channel/wechat/channel-merchant.api';
import { type ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

defineOptions({ name: 'WechatDirectChannelMerchantBasicInfo' });

const props = defineProps<{
  channelMchNo: string;
  channelMerchant: ChannelMerchantResult;
}>();

const visible = ref(false);
const loading = ref(false);
// 直连通道商户配置(含 wxMchId)
const config = ref<WechatDirectChannelMerchantConfig>({});
// 转账场景选项(仅用于场景名称展示)
const sceneOptions = ref<WechatTransferSceneOption[]>([]);

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

/** 加载微信直连通道商户配置 */
function loadConfig() {
  if (!props.channelMchNo) {
    return;
  }
  loading.value = true;
  config.value = {};

  WechatDirectChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
    .then(({ data }) => {
      config.value = data || {};
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 转账场景名称(根据 code 匹配, 只读展示) */
const sceneName = computed(() => {
  const code = config.value.transferScene;
  if (!code) return '-';
  return sceneOptions.value.find((s) => s.code === code)?.name || code;
});

function open() {
  visible.value = true;
  loadConfig();
  // 加载场景选项用于名称展示
  WechatDirectChannelMerchantApi.findSceneOptions().then((res) => {
    sceneOptions.value = res.data || [];
  });
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
        <a-descriptions-item :label="$t('payment.channel.wechatPay.mchId')">
          {{ config.wxMchId || '-' }}
        </a-descriptions-item>
        <!-- 国际化：转账场景(只读, 编辑请使用独立的转账场景配置卡片) -->
        <a-descriptions-item :label="$t('payment.channel.wechatPay.transferScene')">
          {{ sceneName }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

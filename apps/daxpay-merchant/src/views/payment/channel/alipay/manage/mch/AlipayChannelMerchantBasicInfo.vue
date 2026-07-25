<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayDirectChannelMerchantApi,
    type AlipayDirectChannelMerchantConfig,
  } from '#/api/payment/alipay/alipay-direct-channel-merchant.api';

  defineOptions({ name: 'AlipayChannelMerchantBasicInfo' });

  const props = defineProps<{
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
  }>();

  const visible = ref(false);
  const loading = ref(false);
  // 直连通道商户配置(含 alipayUserId)
  const directConfig = ref<AlipayDirectChannelMerchantConfig>({});

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
   * 加载支付宝直连通道商户配置
   */
  function loadConfig() {
    if (!props.channelMchNo) {
      return;
    }
    loading.value = true;
    // 重置状态
    directConfig.value = {};
    AlipayDirectChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
      .then(({ data }) => {
        directConfig.value = data || {};
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
        <!-- 国际化: 通道商户号 -->
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantNo')">
          {{ channelMerchant.channelMchNo || '-' }}
        </a-descriptions-item>
        <!-- 国际化: 通道商户名称 -->
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')">
          {{ channelMerchant.channelMerchantName || '-' }}
        </a-descriptions-item>
        <!-- 国际化: 是否启用 -->
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.enable')">
          {{ enableLabel }}
        </a-descriptions-item>
        <!-- 国际化: 来源 -->
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.source')">
          {{ sourceLabel }}
        </a-descriptions-item>
        <!-- 国际化: 环境状态 -->
        <a-descriptions-item :label="$t('payment.merchant.channelMerchant.envStatus')">
          <a-tag :color="channelMerchant.sandbox ? 'orange' : 'blue'">
            {{
              channelMerchant.sandbox
                ? $t('payment.merchant.channelMerchant.sandboxLabel')
                : $t('payment.merchant.channelMerchant.prodLabel')
            }}
          </a-tag>
        </a-descriptions-item>
        <!-- 国际化: 支付宝商家PID -->
        <a-descriptions-item :label="$t('payment.merchant.alipayDirectApp.alipayUserId')">
          {{ directConfig.alipayUserId || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

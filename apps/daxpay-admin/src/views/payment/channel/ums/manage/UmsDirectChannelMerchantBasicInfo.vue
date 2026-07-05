<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { type ChannelMerchantResult } from '#/api/payment/channel/channel-merchant.api';
  import {
    UmsDirectChannelMerchantApi,
    type UmsDirectChannelMerchantConfig,
  } from '#/api/payment/channel/ums/channel-merchant.api';

  defineOptions({ name: 'UmsDirectChannelMerchantBasicInfo' });

  const props = defineProps<{
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const config = ref<UmsDirectChannelMerchantConfig>({});

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

  const sandboxLabel = computed(() => (config.value.sandbox ? $t('common.yes') : $t('common.no')));

  function loadConfig() {
    if (!props.channelMchNo) {
      return;
    }
    loading.value = true;
    config.value = {};

    UmsDirectChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
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
        <!-- 国际化: 银联商务商户号 -->
        <a-descriptions-item :label="$t('payment.channel.ums.merchantNo')">
          {{ config.merchantNo || '-' }}
        </a-descriptions-item>
        <!-- 国际化: 终端号 -->
        <a-descriptions-item :label="$t('payment.channel.ums.terminalNo')">
          {{ config.terminalNo || '-' }}
        </a-descriptions-item>
        <!-- 国际化: 订单号前缀 -->
        <a-descriptions-item :label="$t('payment.channel.ums.orderPrefix')">
          {{ config.orderPrefix || '-' }}
        </a-descriptions-item>
        <!-- 国际化: 沙箱环境 -->
        <a-descriptions-item :label="$t('payment.channel.ums.sandbox')">
          {{ sandboxLabel }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

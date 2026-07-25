<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DouyinDirectChannelMerchantApi,
    type DouyinDirectChannelMerchantConfig,
  } from '#/api/payment/channel/douyin/channel-merchant.api';
  import { type ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  defineOptions({ name: 'DouyinDirectChannelMerchantBasicInfo' });

  const props = defineProps<{
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const config = ref<DouyinDirectChannelMerchantConfig>({});

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

  function loadConfig() {
    if (!props.channelMchNo) {
      return;
    }
    loading.value = true;
    config.value = {};

    DouyinDirectChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
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
        <a-descriptions-item :label="$t('payment.channel.douyin.douyinMchId')">
          {{ config.dyMchId || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

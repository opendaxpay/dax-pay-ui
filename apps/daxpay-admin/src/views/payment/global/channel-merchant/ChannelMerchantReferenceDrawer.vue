<script lang="ts" setup>
  import type { ChannelMerchantReferenceResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { ChannelMerchantApi } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  /**
   * 通道商户引用明细抽屉
   *
   * 展示通道商户被四类配置（通道路由·场景模式/通道路由·基础模式/网关支付配置/收银台支付入口）
   * 引用的明细，按应用分组；空引用显示「未被任何配置引用」。
   */
  const props = defineProps<{
    /** 通道商户号 */
    channelMchNo?: string;
    /** 通道商户名称(标题展示用) */
    channelMerchantName?: string;
    /** 是否打开 */
    open: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
  }>();

  const loading = ref(false);
  const detail = ref<ChannelMerchantReferenceResult>();

  // 引用明细抽屉标题: 带商户名时「引用明细 - {商户名}」, 否则「引用明细」
  const drawerTitle = computed(() =>
    props.channelMerchantName
      ? $t('payment.merchant.channelMerchant.referenceDrawerTitleWithName', {
          name: props.channelMerchantName,
        })
      : $t('payment.merchant.channelMerchant.referenceDrawerTitle'),
  );

  /** 加载引用明细 */
  function load() {
    if (!props.channelMchNo) return;
    loading.value = true;
    ChannelMerchantApi.referenceDetail(props.channelMchNo)
      .then(({ data }) => {
        detail.value = data;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 关闭抽屉 */
  function handleClose() {
    emit('update:open', false);
  }

  watch(
    () => props.open,
    (open) => {
      if (open) {
        load();
      }
    },
  );
</script>

<template>
  <a-drawer :open="open" :title="drawerTitle" :default-size="520" @close="handleClose">
    <a-spin :spinning="loading">
      <div v-if="detail">
        <!-- 总引用处数概览 -->
        <a-descriptions :column="1" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.channelMerchantNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.merchant.channelMerchant.referenceTotalLabel')">
            {{ detail.total ?? 0 }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 空引用提示 -->
        <a-empty v-if="!detail.total" :description="$t('payment.merchant.channelMerchant.referenceEmpty')" />

        <!-- 按应用分组展示引用明细 -->
        <div v-for="app in detail.apps || []" :key="app.appId" class="mb-4">
          <a-divider orientation="left" plain>
            {{ app.appName || app.appId }}({{ app.appId }}) ·
            {{ $t('payment.merchant.channelMerchant.referenceAppRefs', { count: app.refs?.length || 0 }) }}
          </a-divider>
          <div v-for="(item, index) in app.refs || []" :key="index" class="mb-2 flex items-center gap-2">
            <a-tag>{{ item.typeName }}</a-tag>
            <span>{{ item.detail }}</span>
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped></style>

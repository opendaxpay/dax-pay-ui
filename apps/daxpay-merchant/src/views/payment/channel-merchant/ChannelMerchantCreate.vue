<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';

  defineOptions({ name: 'ChannelMerchantCreate' });

  const router = useRouter();
  const merchantInfo = ref<MerchantInfo>({});
  const merchantLoading = ref(false);

  /** 加载当前商户信息 */
  async function loadMerchantInfo() {
    merchantLoading.value = true;
    try {
      const { data } = await MerchantApi.get();
      merchantInfo.value = data || {};
    } finally {
      merchantLoading.value = false;
    }
  }

  /** 返回列表 */
  function handleBack() {
    router.push({ path: '/mch/channel-merchant' });
  }

  onMounted(() => {
    loadMerchantInfo();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <!-- 国际化：创建通道商户（与菜单一致） -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.channelMerchant.createTitle') }}</span>
          <span v-if="merchantLoading" class="text-sm text-muted-foreground">
            <a-skeleton-input :active="true" size="small" />
          </span>
          <span v-else-if="merchantInfo.mchName" class="text-sm text-muted-foreground"
            >({{ merchantInfo.mchName }})</span
          >
        </div>
      </template>

      <div class="mb-6">
        <a-alert type="info" show-icon :message="$t('payment.merchant.channelMerchant.createConfigPending')" />
      </div>

      <div class="flex justify-center py-8">
        <a-empty :description="$t('payment.merchant.channelMerchant.createConfigPending')">
          <a-button type="primary" @click="handleBack">{{ $t('payment.merchant.channelMerchant.back') }}</a-button>
        </a-empty>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ChannelMerchantApi,
    type ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelMerchantNameEditModal from './ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from './CommonChannelMerchantBasicInfo.vue';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  const route = useRoute();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // 商户端仅要求 id（product 可选，缺失时用详情回填）
  const routeContext = useRequiredRouteQuery({
    keys: ['id'],
    messageKey: 'payment.merchant.channelMerchant.missingId',
    fallbackPath: '/mch/channel-merchant',
  });

  const channelMerchantId = ref('');
  const product = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const loading = ref(false);
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const nameEditRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();

  const pageTitle = computed(() => {
    const p = product.value || channelMerchant.value.product || '';
    const i18nKey = productI18nMap[p];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[p] || $t('payment.merchant.channelMerchant.manageTitleDefault');
  });

  /** 加载通道商户公共信息 */
  function loadChannelMerchant() {
    if (!channelMerchantId.value) {
      return;
    }
    loading.value = true;
    ChannelMerchantApi.findById(channelMerchantId.value)
      .then(({ data }) => {
        if (data) {
          channelMerchant.value = data;
          if (!product.value && data.product) {
            product.value = data.product;
          }
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function goBack() {
    router.push({ path: '/mch/channel-merchant' });
  }

  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    channelMerchantId.value = routeContext.query.value.id;
    product.value = normalizeRouteQueryValue(route.query.product) || '';
  }

  watch(() => route.query, syncRouteState, { deep: true });

  onMounted(() => {
    syncRouteState();
    if (!routeContext.isValid.value) {
      return;
    }
    loadChannelMerchant();
  });
</script>

<template>
  <div v-if="!routeContext.isValid" class="m-4">
    <a-result status="warning" :title="$t('payment.merchant.channelMerchant.missingId')">
      <template #extra>
        <a-button type="primary" @click="routeContext.goFallback">
          {{ $t('payment.merchant.channelMerchant.back') }}
        </a-button>
      </template>
    </a-result>
  </div>
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex w-full items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <a-button type="text" class="flex items-center justify-center rounded-full hover:bg-accent" @click="goBack">
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
              </template>
            </a-button>
            <!-- 国际化：通道商户管理 -->
            <span class="text-lg font-bold text-foreground">{{ pageTitle }}</span>
            <span v-if="channelMerchant.channelMerchantName" class="text-sm text-muted-foreground">
              ({{ channelMerchant.channelMerchantName }})
            </span>
          </div>
        </div>
      </template>

      <a-spin :spinning="loading">
        <div class="mb-6">
          <a-alert type="info" show-icon :message="$t('payment.merchant.channelMerchant.detailConfigPending')" />
        </div>

        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="12" :lg="8">
            <a-card
              hoverable
              class="h-full"
              @click="basicInfoRef?.open()"
            >
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardBasicInfo')"
                :description="$t('payment.merchant.channelMerchant.cardBasicInfoDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:profile-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
          <a-col v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)" :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="nameEditRef?.open()">
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardEditMerchantName')"
                :description="$t('payment.merchant.channelMerchant.cardEditMerchantNameDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:edit-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </a-card>

    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMerchant.channelMchNo || ''"
      :channel-merchant="channelMerchant"
    />
    <ChannelMerchantNameEditModal
      ref="nameEditRef"
      :channel-merchant="channelMerchant"
      @success="loadChannelMerchant"
    />
  </div>
</template>

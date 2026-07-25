<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type DouyinMchApp, DouyinMchAppApi } from '#/api/payment/channel/douyin/mch-app.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import DouyinMchAppCard from './DouyinMchAppCard.vue';
  import DouyinMchAppDetail from './DouyinMchAppDetail.vue';
  import DouyinMchAppEdit from './DouyinMchAppEdit.vue';

  defineOptions({ name: 'DouyinMchAppManage' });

  const route = useRoute();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // 商户端仅需 channelMchNo（mchNo 由后端上下文取）
  const routeContext = useRequiredRouteQuery({
    keys: ['channelMchNo'],
    messageKey: 'payment.merchant.channelMerchant.missingChannelMchNo',
    fallbackPath: computed(() => {
      const id = normalizeRouteQueryValue(route.query.channelMerchantId);
      // product 由本页所属渠道决定（抖音直连）
      const product = ProductEnum.DOUYIN_PAY;
      if (id) {
        return { path: '/mch/channel-merchant/detail', query: { id, product } };
      }
      return '/mch/channel-merchant';
    }),
  });

  const loading = ref(false);
  const channelMchNo = ref('');
  const channelMerchantName = ref('');
  const appList = ref<DouyinMchApp[]>([]);
  const editRef = ref<InstanceType<typeof DouyinMchAppEdit>>();
  const detailRef = ref<InstanceType<typeof DouyinMchAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Channel.App.MANAGE));

  const pageTitle = computed(() => {
    const base = $t('payment.channel.douyinMchApp.appManageTitle');
    return channelMerchantName.value ? `${base} (${channelMerchantName.value})` : base;
  });

  function loadAppList() {
    if (!channelMchNo.value) {
      return;
    }
    loading.value = true;
    DouyinMchAppApi.listByChannelMchNo(channelMchNo.value)
      .then(({ data }) => {
        appList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    channelMchNo.value = routeContext.query.value.channelMchNo!;
    channelMerchantName.value = normalizeRouteQueryValue(route.query.channelMerchantName);
  }

  function handleBack() {
    const id = normalizeRouteQueryValue(route.query.channelMerchantId);
    // product 由本页所属渠道决定（抖音直连）
    const product = ProductEnum.DOUYIN_PAY;
    if (id) {
      router.push({
        path: '/mch/channel-merchant/detail',
        query: { id, product },
      });
    } else {
      router.push({ path: '/mch/channel-merchant' });
    }
  }

  function handleAdd() {
    editRef.value?.show(channelMchNo.value);
  }

  function handleManage(record: DouyinMchApp) {
    detailRef.value?.show(channelMchNo.value, record);
  }

  function handleEdit(record: DouyinMchApp) {
    editRef.value?.showEdit(channelMchNo.value, record);
  }

  onMounted(() => {
    syncRouteState();
    if (!routeContext.isValid.value) {
      return;
    }
    loadAppList();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.merchant.channelMerchant.missingChannelMchNo')"
    :back-text="$t('payment.merchant.channelMerchant.back')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex w-full items-center justify-between gap-4">
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
            <span class="text-lg font-bold text-foreground">{{ pageTitle }}</span>
          </div>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!loading && appList.length === 0 && !canAdd"
          class="py-12"
          :description="$t('payment.channel.douyinMchApp.emptyAppList')"
        />
        <div v-else class="app-card-grid">
          <DouyinMchAppCard
            v-for="app in appList"
            :key="app.id ?? app.douyinAppId"
            :record="app"
            @edit="handleEdit(app)"
            @manage="handleManage(app)"
          />

          <div
            v-if="canAdd"
            class="add-card flex h-full min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
            @click="handleAdd"
          >
            <IconifyIcon icon="ant-design:plus-outlined" class="text-3xl" />
            <span class="text-sm font-medium">{{ $t('payment.channel.douyinMchApp.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <DouyinMchAppEdit ref="editRef" @ok="loadAppList" />
    <DouyinMchAppDetail ref="detailRef" @deleted="loadAppList" />
  </div>
</template>

<style scoped>
  .app-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    padding: 4px;
    min-height: 120px;
  }

  @media (max-width: 1400px) {
    .app-card-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .app-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .app-card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

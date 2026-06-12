<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    WechatMchAppApi,
    type WechatMchApp,
  } from '#/api/payment/wechatMchApp.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { PermCodes } from '#/constants/perm-codes';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import { usePermission } from '#/hooks/usePermission';

  import WechatMchAppCard from './WechatMchAppCard.vue';
  import WechatMchAppDetail from './WechatMchAppDetail.vue';
  import WechatMchAppEdit from './WechatMchAppEdit.vue';

  defineOptions({ name: 'WechatMchAppManage' });

  const route = useRoute();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo', 'channelMchNo'],
    messageKey: computed(() => {
      if (!normalizeRouteQueryValue(route.query.mchNo)) {
        return 'payment.common.route.missingMchNo';
      }
      return 'payment.merchant.channelMerchant.missingChannelMchNo';
    }),
    fallbackPath: computed(() => {
      const mchNo = normalizeRouteQueryValue(route.query.mchNo);
      const id = normalizeRouteQueryValue(route.query.channelMerchantId);
      const product = normalizeRouteQueryValue(route.query.product);
      if (mchNo && id && product) {
        return `/payment/merchant/channel-merchant/detail?mchNo=${mchNo}&id=${id}&product=${product}`;
      }
      return mchNo ? `/payment/merchant/channel-merchant?mchNo=${mchNo}` : '/payment/merchant';
    }),
  });

  const loading = ref(false);
  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchantName = ref('');
  const appList = ref<WechatMchApp[]>([]);
  const editRef = ref<InstanceType<typeof WechatMchAppEdit>>();
  const detailRef = ref<InstanceType<typeof WechatMchAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.ChannelMerchant.ADD));

  const pageTitle = computed(() => {
    const base = $t('payment.channel.wechatMchApp.appManageTitle');
    return channelMerchantName.value ? `${base} (${channelMerchantName.value})` : base;
  });

  function loadAppList() {
    if (!mchNo.value || !channelMchNo.value) {
      return;
    }
    loading.value = true;
    WechatMchAppApi.listByChannelMchNo(mchNo.value, channelMchNo.value)
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
    mchNo.value = routeContext.query.value.mchNo;
    channelMchNo.value = routeContext.query.value.channelMchNo;
    channelMerchantName.value = normalizeRouteQueryValue(route.query.channelMerchantName);
  }

  function handleBack() {
    const id = normalizeRouteQueryValue(route.query.channelMerchantId);
    const product = normalizeRouteQueryValue(route.query.product) || ProductEnum.WECHAT_ISV;
    router.push({
      path: '/payment/merchant/channel-merchant/detail',
      query: {
        mchNo: mchNo.value,
        id,
        product,
      },
    });
  }

  function handleAdd() {
    editRef.value?.show(mchNo.value, channelMchNo.value);
  }

  function handleManage(record: WechatMchApp) {
    detailRef.value?.show(mchNo.value, channelMchNo.value, record);
  }

  function handleEdit(record: WechatMchApp) {
    editRef.value?.showEdit(mchNo.value, channelMchNo.value, record);
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
    :description="
      $t(
        !routeContext.query.mchNo
          ? 'payment.common.route.missingMchNo'
          : 'payment.merchant.channelMerchant.missingChannelMchNo',
      )
    "
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
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
            <!-- 国际化：微信通道商户应用 -->
            <span class="text-lg font-bold text-foreground">{{ pageTitle }}</span>
          </div>
          <a
            href="https://open.weixin.qq.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-sm font-normal text-primary"
          >
            {{ $t('payment.channel.wechatMchApp.consoleLink') }}
          </a>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!loading && appList.length === 0 && !canAdd"
          class="py-12"
          :description="$t('payment.channel.wechatMchApp.emptyAppList')"
        />
        <div v-else class="app-card-grid">
          <WechatMchAppCard
            v-for="app in appList"
            :key="app.id ?? app.wxAppId"
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
            <span class="text-sm font-medium">{{ $t('payment.channel.wechatMchApp.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <WechatMchAppEdit ref="editRef" @ok="loadAppList" />
    <WechatMchAppDetail ref="detailRef" @deleted="loadAppList" />
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

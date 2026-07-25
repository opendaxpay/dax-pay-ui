<script lang="ts" setup>
  import type { AlipayDirectAppResult } from '#/api/payment/alipay/alipay-direct-app.api';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AlipayDirectAppApi } from '#/api/payment/alipay/alipay-direct-app.api';
  import { ChannelMerchantApi } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import AlipayMchAppCard from './AlipayMchAppCard.vue';
  import AlipayMchAppDetail from './AlipayMchAppDetail.vue';
  import AlipayMchAppEdit from './AlipayMchAppEdit.vue';

  defineOptions({ name: 'AlipayMchAppManage' });

  const router = useRouter();
  const { hasPermission } = usePermission();

  // 商户端仅需 channelMchNo（mchNo 由后端 PaymentContext 强制）
  const routeContext = useRequiredRouteQuery({
    keys: ['channelMchNo'],
    messageKey: 'payment.merchant.channelMerchant.missingChannelMchNo',
    fallbackPath: '/mch/channel-merchant',
  });

  const loading = ref(false);
  const channelMchNo = ref('');
  const channelMerchantName = ref('');
  const channelMerchantId = ref('');
  // 沙箱标识(跟随通道商户, 透传给密钥 Tab)
  const sandbox = ref(false);
  const appList = ref<AlipayDirectAppResult[]>([]);
  const editRef = ref<InstanceType<typeof AlipayMchAppEdit>>();
  const detailRef = ref<InstanceType<typeof AlipayMchAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Channel.App.MANAGE));

  const pageTitle = computed(() => {
    const base = $t('payment.merchant.alipayDirectApp.manageTitle');
    return channelMerchantName.value ? `${base} (${channelMerchantName.value})` : base;
  });

  /** 加载应用列表 */
  function loadAppList() {
    if (!channelMchNo.value) {
      return;
    }
    loading.value = true;
    AlipayDirectAppApi.listByChannelMchNo(channelMchNo.value)
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
    channelMchNo.value = routeContext.query.value.channelMchNo;
  }

  /** 反查通道商户元数据(名称/沙箱/主键), 替代 URL 透传, 保证数据实时 */
  function loadMerchantMeta() {
    if (!channelMchNo.value) {
      return;
    }
    ChannelMerchantApi.findAll()
      .then(({ data }) => {
        const merchant = (data || []).find((m) => m.channelMchNo === channelMchNo.value);
        if (merchant) {
          channelMerchantName.value = merchant.channelMerchantName ?? '';
          channelMerchantId.value = String(merchant.id ?? '');
          sandbox.value = merchant.sandbox ?? false;
        }
      });
  }

  /** 返回通道商户详情或列表 */
  function handleBack() {
    if (channelMerchantId.value) {
      router.push({
        path: '/mch/channel-merchant/detail',
        query: { id: channelMerchantId.value },
      });
    } else {
      router.push({ path: '/mch/channel-merchant' });
    }
  }

  function handleAdd() {
    editRef.value?.show(channelMchNo.value);
  }

  function handleManage(record: AlipayDirectAppResult) {
    detailRef.value?.show(channelMchNo.value, record);
  }

  function handleEdit(record: AlipayDirectAppResult) {
    editRef.value?.showEdit(channelMchNo.value, record);
  }

  onMounted(() => {
    syncRouteState();
    if (!routeContext.isValid.value) {
      return;
    }
    loadAppList();
    // 反查通道商户元数据(标题/返回/sandbox)
    loadMerchantMeta();
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
          :description="$t('payment.merchant.alipayDirectApp.emptyAppList')"
        />
        <div v-else class="app-card-grid">
          <AlipayMchAppCard
            v-for="app in appList"
            :key="app.id ?? app.aliAppId"
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
            <span class="text-sm font-medium">{{ $t('payment.merchant.alipayDirectApp.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <AlipayMchAppEdit ref="editRef" @ok="loadAppList" />
    <AlipayMchAppDetail ref="detailRef" :sandbox="sandbox" @deleted="loadAppList" />
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

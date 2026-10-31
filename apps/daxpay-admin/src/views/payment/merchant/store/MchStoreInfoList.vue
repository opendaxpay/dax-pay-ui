<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi, type MchStoreInfoResult } from '#/api/payment/merchant/store.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchStoreInfoCard from './MchStoreInfoCard.vue';
  import MchStoreInfoEdit from './MchStoreInfoEdit.vue';

  /**
   * 门店管理卡片墙(运营端, 商户工作台「门店管理」子页)
   *
   * 按商户号全量加载 + 客户端关键词/状态双条件过滤 + 新增门店召唤卡 + 未设默认告警条;
   * 整卡点击进入门店详情工作台(无 VIEW 权限整卡不响应)。
   */
  defineOptions({ name: 'MchStoreInfoList' });

  const router = useRouter();

  // 商户号从路由 query 获取
  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { hasPermission } = usePermission();

  const mchNo = computed(() => routeContext.query.value.mchNo);
  // 商户信息（用于标题展示商户名称）
  const merchantInfo = ref<MerchantInfo>({});
  // 页签标题动态化为「{商户名} · 门店管理」
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.merchant.store.store.title'));

  const loading = ref(false);
  // 过滤关键字(前端按门店名称/门店号过滤)
  const filterText = ref('');
  // 状态过滤(空串表示全部状态, 前端客户端过滤)
  const statusFilter = ref('');
  const storeList = ref<MchStoreInfoResult[]>([]);
  const storeEditRef = ref<InstanceType<typeof MchStoreInfoEdit>>();

  /** 状态过滤选项(空串作为「全部状态」占位, 不使用 allow-clear) */
  const statusFilterOptions: { label: string; value: string }[] = [
    // 全部状态
    { label: $t('payment.merchant.store.list.statusAll'), value: '' },
    // 启用
    { label: $t('payment.merchant.store.store.status.enable'), value: 'enable' },
    // 停用
    { label: $t('payment.merchant.store.store.status.disabled'), value: 'disabled' },
  ];

  /** 是否有门店管理权限(召唤卡与新增入口同条件) */
  const canAdd = computed(() => hasPermission(PermCodes.Merchant.Store.MANAGE));

  /** 本地过滤后的门店列表(门店名称/门店号 + 状态, 不分页) */
  const filteredStoreList = computed(() => {
    const keyword = filterText.value.trim().toLowerCase();
    return storeList.value.filter((store) => {
      if (statusFilter.value && store.status !== statusFilter.value) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const name = (store.storeName || '').toLowerCase();
      const storeNo = (store.storeNo || '').toLowerCase();
      return name.includes(keyword) || storeNo.includes(keyword);
    });
  });

  // 是否有门店但没有默认门店(用于告警横幅)
  const hasStoreWithoutDefault = computed(() => {
    return storeList.value.length > 0 && !storeList.value.some((s) => s.defaultStore);
  });

  /**
   * 加载商户名下全部门店(卡片墙, 不分页)
   */
  function loadStoreList() {
    if (!mchNo.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    MchStoreInfoApi.listAllByMch(mchNo.value)
      .then(({ data }) => {
        storeList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    // 加载商户信息用于标题展示
    loadMerchantInfo();
    loadStoreList();
  });

  /**
   * 返回商户工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/merchant/manage',
      query: { mchNo: mchNo.value },
    });
  }

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    if (!mchNo.value) return;
    MerchantApi.findByMchNo(mchNo.value).then(({ data }) => {
      if (data) {
        merchantInfo.value = data;
        // 页签标题动态化为「{商户名} · 门店管理」
        setTabObjectTitle(data.mchName || '');
      }
    });
  }

  function handleAdd() {
    storeEditRef.value?.show(mchNo.value!);
  }

  /**
   * 进入门店详情工作台(携带门店 id/storeNo + 商户号)
   */
  function handleWorkbench(row: MchStoreInfoResult) {
    router.push({
      path: '/payment/merchant/store/workbench',
      query: { id: row.id, storeNo: row.storeNo, mchNo: mchNo.value },
    });
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 标题栏: 返回 + 功能名 +（商户名）, 与工作台子页统一形态 -->
        <PageTitleBar
          back
          :title="$t('payment.merchant.store.store.title')"
          :name="merchantInfo.mchName || ''"
          @back="handleBack"
        />
      </template>
      <template #extra>
        <div class="flex items-center gap-2">
          <a-input
            v-model:value="filterText"
            allow-clear
            class="w-56"
            :placeholder="$t('payment.merchant.store.list.filterPlaceholder')"
          />
          <a-select v-model:value="statusFilter" :options="statusFilterOptions" class="w-32" />
        </div>
      </template>

      <a-spin :spinning="loading">
        <!-- 有门店但未设置默认门店时提示(间距放 wrapper, 避免 antd 覆盖 Tailwind) -->
        <div v-if="hasStoreWithoutDefault && !loading" class="mb-4">
          <a-alert :message="$t('payment.merchant.store.store.noDefaultStoreTip')" type="warning" show-icon />
        </div>

        <!-- 空态: 无门店且无新增权限时展示 -->
        <div v-if="!loading && filteredStoreList.length === 0 && !canAdd" class="py-12">
          <a-empty :description="$t('payment.merchant.store.list.empty')" />
        </div>
        <div v-else class="store-card-grid">
          <MchStoreInfoCard
            v-for="store in filteredStoreList"
            :key="store.id ?? store.storeNo"
            :record="store"
            @open="handleWorkbench(store)"
          />

          <!-- 召唤卡: 权限与新增入口同条件, 点击打开新增门店抽屉 -->
          <div
            v-if="canAdd"
            class="flex h-full min-h-[126px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/60 text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
            @click="handleAdd"
          >
            <div
              class="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-muted transition-all duration-300 group-hover:scale-110"
            >
              <IconifyIcon icon="ant-design:plus-outlined" class="text-xl" />
            </div>
            <span class="text-sm font-bold">{{ $t('payment.merchant.store.list.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <MchStoreInfoEdit ref="storeEditRef" @ok="loadStoreList" />
  </div>
</template>

<style scoped>
  .store-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
</style>

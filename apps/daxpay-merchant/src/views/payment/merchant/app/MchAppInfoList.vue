<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import useTablePage from '#/hooks/useTablePage';

  import MchAppInfoCard from './MchAppInfoCard.vue';
  import MchAppInfoEdit from './MchAppInfoEdit.vue';

  defineOptions({ name: 'MchAppInfoList' });

  const router = useRouter();
  const { hasPermission } = usePermission();

  // 当前商户号（MerchantApi.get，不走 URL；新增应用时传入）
  const mchNo = ref('');
  const appEditRef = ref<InstanceType<typeof MchAppInfoEdit>>();

  /**
   * 分页查询应用列表（后端按 PaymentContext 隔离，可不传 mchNo）
   */
  async function queryPage() {
    const { data } = await MchAppInfoApi.page({
      current: pages.current,
      size: pages.size,
    });
    if (data) {
      pageQueryResHandle(data);
    } else {
      loading.value = false;
    }
  }

  const { loading, pages, pagination, pageQueryResHandle, query, handleOk } = useTablePage<MchAppInfoResult>(queryPage);

  // 卡片列表一次加载较多条，避免分页切换
  pages.size = 200;

  const appList = computed(() => (pagination.records as MchAppInfoResult[]) || []);

  /**
   * 解析创建时间用于排序
   */
  function getCreateTimestamp(createTime?: null | string) {
    if (!createTime) return 0;
    const time = new Date(createTime).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  /**
   * 应用列表排序：默认应用排最前，其余按创建时间升序
   */
  const sortedAppList = computed(() => {
    return appList.value.toSorted((a, b) => {
      if (a.defaultApp && !b.defaultApp) return -1;
      if (!a.defaultApp && b.defaultApp) return 1;
      return getCreateTimestamp(a.createTime) - getCreateTimestamp(b.createTime);
    });
  });

  /**
   * 是否有应用但没有默认应用
   */
  const hasAppWithoutDefault = computed(() => {
    return appList.value.length > 0 && !appList.value.some((app) => app.defaultApp);
  });

  /** 是否展示无默认应用提示条 */
  const showNoDefaultTip = computed(() => hasAppWithoutDefault.value && !loading.value);

  /**
   * 加载当前商户号（新增应用时传入）
   */
  async function loadMerchantInfo() {
    const { data } = await MerchantApi.get();
    if (data) {
      mchNo.value = data.mchNo || '';
    }
  }

  /**
   * 进入应用工作台
   */
  function openAppWorkbench(row: MchAppInfoResult) {
    router.push({
      path: '/mch/app/manage',
      query: { appId: row.appId },
    });
  }

  function handleAdd() {
    appEditRef.value?.show(mchNo.value);
  }

  onMounted(async () => {
    await loadMerchantInfo();
    query();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <!-- 国际化：有应用但未设置默认应用时提示 -->
      <div v-if="showNoDefaultTip" class="mb-4">
        <a-alert :message="$t('payment.merchant.app.app.noDefaultAppTip')" type="warning" show-icon />
      </div>

      <a-spin :spinning="loading">
        <div class="app-card-grid">
          <MchAppInfoCard
            v-for="row in sortedAppList"
            :key="row.id || row.appId"
            :record="row"
            @open="openAppWorkbench(row)"
          />

          <!-- 新增应用占位卡片 -->
          <div
            v-if="hasPermission(PermCodes.Merchant.App.MANAGE)"
            class="add-card group flex h-full min-h-[156px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
            @click="handleAdd"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10"
            >
              <IconifyIcon icon="ant-design:plus-outlined" class="h-7 w-7" />
            </div>
            <span class="text-sm font-bold">{{ $t('payment.merchant.app.app.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <MchAppInfoEdit ref="appEditRef" @ok="handleOk" />
  </div>
</template>

<style scoped>
  .app-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
</style>

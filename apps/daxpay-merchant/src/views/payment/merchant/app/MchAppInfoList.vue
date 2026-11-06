<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { ResourceAddCard, ResourceCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import useTablePage from '#/hooks/useTablePage';

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

  /** 应用卡底栏状态(状态点 + 文案, 启用=主色点 / 停用=灰点) */
  function appStatus(app: MchAppInfoResult) {
    const enabled = app.status === 'enable';
    return {
      dotClass: enabled ? 'bg-primary' : 'bg-muted-foreground/60',
      // 启用 / 禁用
      text: enabled ? $t('payment.merchant.app.app.statusEnable') : $t('payment.merchant.app.app.statusDisabled'),
    };
  }

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
  <div class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 页头与菜单名一致（应用管理）, 对齐 plus 一级菜单页形态 -->
        <PageTitleBar :title="$t('payment.merchant.app.app.myApps')" />
      </template>
      <!-- 国际化：有应用但未设置默认应用时提示 -->
      <div v-if="showNoDefaultTip" class="mb-4">
        <a-alert :message="$t('payment.merchant.app.app.noDefaultAppTip')" type="warning" show-icon />
      </div>

      <a-spin :spinning="loading">
        <ResourceCardGrid>
          <ResourceCard
            v-for="row in sortedAppList"
            :key="row.id || row.appId"
            :title="row.appName || '-'"
            :subtitle="$t('payment.merchant.app.app.appIdPrefix', { appId: row.appId || '-' })"
            icon="ant-design:appstore-outlined"
            :active="row.defaultApp === true"
            :action-text="$t('payment.merchant.app.app.enterConfig')"
            :aria-label="$t('payment.merchant.app.app.openActionAria')"
            :status="appStatus(row)"
            @open="openAppWorkbench(row)"
          >
            <!-- 默认应用标记(仅默认应用展示) -->
            <template v-if="row.defaultApp" #titleExtra>
              <a-tag color="processing" class="!m-0 shrink-0 !text-xs">
                {{ $t('payment.merchant.app.app.defaultTag') }}
              </a-tag>
            </template>
          </ResourceCard>

          <!-- 新增应用召唤卡(权限与新增入口同条件) -->
          <template v-if="hasPermission(PermCodes.Merchant.App.MANAGE)" #add>
            <ResourceAddCard :text="$t('payment.merchant.app.app.addCard')" @click="handleAdd" />
          </template>
        </ResourceCardGrid>
      </a-spin>
    </a-card>

    <MchAppInfoEdit ref="appEditRef" @ok="handleOk" />
  </div>
</template>

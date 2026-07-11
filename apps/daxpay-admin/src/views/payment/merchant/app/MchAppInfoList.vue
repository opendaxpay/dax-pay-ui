<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import useTablePage from '#/hooks/useTablePage';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchAppInfoCard from './MchAppInfoCard.vue';
  import MchAppInfoEdit from './MchAppInfoEdit.vue';
  import MchAppNotifyConfig from './MchAppNotifyConfig.vue';

  defineOptions({ name: 'MchAppInfoList' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const mchNo = computed(() => routeContext.query.value.mchNo);
  const merchantInfo = ref<MerchantInfo>({});
  const appEditRef = ref<InstanceType<typeof MchAppInfoEdit>>();

  // 通知配置抽屉
  const notifyDrawerVisible = ref(false);
  const notifyConfigApp = ref<MchAppInfoResult>({});

  /**
   * 分页查询应用列表
   */
  async function queryPage() {
    if (!mchNo.value) {
      loading.value = false;
      return;
    }
    const { data } = await MchAppInfoApi.page({
      mchNo: mchNo.value,
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
   * 应用列表排序：默认应用排最前，其余按创建时间升序（先创建的在前）
   */
  const sortedAppList = computed(() => {
    return [...appList.value].sort((a, b) => {
      if (a.defaultApp && !b.defaultApp) return -1;
      if (!a.defaultApp && b.defaultApp) return 1;
      return getCreateTimestamp(a.createTime) - getCreateTimestamp(b.createTime);
    });
  });

  /**
   * 是否有应用但没有默认应用
   */
  const hasAppWithoutDefault = computed(() => {
    return appList.value.length > 0 && !appList.value.some(app => app.defaultApp);
  });

  /** 是否展示无默认应用提示条 */
  const showNoDefaultTip = computed(() => hasAppWithoutDefault.value && !loading.value);

  /**
   * 有提示条时收紧卡片内容区上内边距，与提示条下边距对称
   */
  const cardBodyStyle = computed(() => {
    if (showNoDefaultTip.value) {
      return { paddingTop: '16px' };
    }
    return undefined;
  });

  /**
   * 返回工作台
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
      }
    });
  }

  function handleAdd() {
    appEditRef.value?.show(mchNo.value);
  }

  function handleEdit(row: MchAppInfoResult) {
    appEditRef.value?.showEdit(mchNo.value, row);
  }

  /**
   * 打开通知配置抽屉
   */
  function handleNotifyConfig(row: MchAppInfoResult) {
    notifyConfigApp.value = row;
    notifyDrawerVisible.value = true;
  }

  /**
   * 设为默认
   */
  function handleSetDefault(row: MchAppInfoResult) {
    confirm({
      content: $t('payment.merchant.app.app.confirmSetDefault'),
      onOk() {
        return MchAppInfoApi.setDefault(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          handleOk();
        });
      },
    });
  }

  /**
   * 取消默认
   */
  function handleCancelDefault(row: MchAppInfoResult) {
    confirm({
      content: $t('payment.merchant.app.app.confirmCancelDefault'),
      onOk() {
        return MchAppInfoApi.clearDefault(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          handleOk();
        });
      },
    });
  }

  /**
   * 删除应用
   */
  function handleDelete(row: MchAppInfoResult) {
    if (row.defaultApp && appList.value.length > 1) {
      message.warning($t('payment.merchant.app.app.deleteDefaultBlocked'));
      return;
    }
    confirm({
      content: $t('payment.merchant.app.app.confirmDelete'),
      onOk() {
        return MchAppInfoApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          handleOk();
        });
      },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadMerchantInfo();
    query();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm" :body-style="cardBodyStyle">
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
          <!-- 国际化：应用管理（与菜单 title 一致） -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.app.app.title') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>

      <!-- 国际化：有应用但未设置默认应用时提示 -->
      <div v-if="showNoDefaultTip" class="no-default-app-tip">
        <a-alert
          :message="$t('payment.merchant.app.app.noDefaultAppTip')"
          type="warning"
          show-icon
        />
      </div>

      <a-spin :spinning="loading">
        <div class="app-card-grid">
          <MchAppInfoCard
            v-for="row in sortedAppList"
            :key="row.id"
            :mch-no="mchNo"
            :record="row"
            @edit="handleEdit(row)"
            @notify-config="handleNotifyConfig(row)"
            @set-default="handleSetDefault(row)"
            @cancel-default="handleCancelDefault(row)"
            @delete="handleDelete(row)"
          />

          <!-- 新增应用占位卡片 -->
          <div
            v-if="hasPermission(PermCodes.Merchant.App.MANAGE)"
            class="add-card flex h-full min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
            @click="handleAdd"
          >
            <IconifyIcon icon="ant-design:plus-outlined" class="text-3xl" />
            <span class="text-sm font-medium">{{ $t('payment.merchant.app.app.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <MchAppInfoEdit ref="appEditRef" @ok="handleOk" />

    <!-- 应用事件通知配置抽屉 -->
    <MchAppNotifyConfig
      v-model:visible="notifyDrawerVisible"
      :app-id="notifyConfigApp.appId"
      :app-name="notifyConfigApp.appName"
    />
  </div>
</template>

<style scoped>
  /* 提示条：上下与卡片列表间距一致（上由 cardBodyStyle.paddingTop，下由 margin-bottom） */
  .no-default-app-tip {
    margin-bottom: 16px;
  }

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

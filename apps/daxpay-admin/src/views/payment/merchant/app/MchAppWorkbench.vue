<script lang="ts" setup>
  import type { WorkbenchTile, WorkbenchTileGroup } from '@daxpay/ui-biz/components/workbench-tile';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { WorkbenchTileGrid } from '@daxpay/ui-biz/components/workbench-tile';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { NOTIFY_CONFIG_BUILDING } from '#/constants/feature-flags';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchAppInfoEdit from './MchAppInfoEdit.vue';
  import MchAppNotifyConfig from './MchAppNotifyConfig.vue';

  defineOptions({ name: 'MchAppWorkbench' });

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();
  const { hasPermission } = usePermission();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo', 'appId'],
    messageKey: computed(() =>
      normalizeRouteQueryValue(route.query.mchNo)
        ? 'payment.common.route.missingAppContext'
        : 'payment.common.route.missingMchNo',
    ),
    fallbackPath: computed(() => {
      const no = normalizeRouteQueryValue(route.query.mchNo);
      return no ? { path: '/payment/merchant/app', query: { mchNo: no } } : '/payment/merchant';
    }),
  });

  const mchNo = computed(() => routeContext.query.value.mchNo);
  const appId = computed(() => routeContext.query.value.appId);

  const loading = ref(false);
  const appInfo = ref<MchAppInfoResult>({});
  const appEditRef = ref<InstanceType<typeof MchAppInfoEdit>>();
  const notifyDrawerVisible = ref(false);
  // 页签标题动态化为「{应用名} · 应用配置」
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.merchant.app.app.workbenchTitle'));

  /**
   * 功能卡片（权限过滤后展示），视觉对齐商户工作台
   * 危险操作卡（删除/取消默认）在数据侧直接标记 danger/active
   */
  const functionCards = computed((): WorkbenchTileGroup[] => {
    const groups: WorkbenchTileGroup[] = [];

    // 支付配置: 收款链路本身——走哪个通道商户、网关与码牌路由、收银台展示、对外协议接入
    const paymentCards: WorkbenchTile[] = [];
    if (hasPermission(PermCodes.Merchant.AppRoute.VIEW)) {
      paymentCards.push({
        key: 'payRoute',
        title: $t('payment.merchant.app.app.payRoute'),
        icon: 'ant-design:node-index-outlined',
        description: $t('payment.merchant.app.app.payRouteDesc'),
      });
    }
    if (hasPermission(PermCodes.Merchant.GatewayPayConfig.VIEW)) {
      paymentCards.push({
        key: 'gatewayPayConfig',
        title: $t('payment.merchant.app.app.gatewayPayConfig'),
        icon: 'ant-design:qrcode-outlined',
        description: $t('payment.merchant.app.app.gatewayPayConfigDesc'),
      });
    }
    if (hasPermission(PermCodes.Merchant.GatewayCashier.VIEW)) {
      paymentCards.push({
        key: 'cashier',
        title: $t('payment.merchant.app.app.cashierConfig'),
        icon: 'ant-design:desktop-outlined',
        description: $t('payment.merchant.app.app.cashierConfigDesc'),
      });
    }
    // 易支付协议配置：subpage /payment/merchant/easypay?mchNo&appId
    if (hasPermission(PermCodes.Merchant.EasyPay.VIEW)) {
      paymentCards.push({
        key: 'easypay',
        // 卡片标题与菜单 i18n_key 一致
        title: $t('menu.payment.merchant.easypay'),
        icon: 'ant-design:api-outlined',
        description: $t('payment.merchant.app.easypay.desc'),
      });
    }
    if (paymentCards.length > 0) {
      groups.push({
        group: $t('payment.merchant.app.app.groupConfig'),
        color: 'green',
        cards: paymentCards,
      });
    }

    // 通知与设备: 收款之后的联动——业务事件回调
    const notifyCards: WorkbenchTile[] = [];
    if (hasPermission(PermCodes.Merchant.NotifyConfig.VIEW)) {
      notifyCards.push({
        key: 'notify',
        title: $t('payment.merchant.app.app.notifyConfig'),
        icon: 'ant-design:notification-outlined',
        description: $t('payment.merchant.app.app.notifyConfigDesc'),
        // 异步通知配置功能未开放, 入口保留并加建设中角标, 点入显示占位
        building: NOTIFY_CONFIG_BUILDING,
      });
    }
    if (notifyCards.length > 0) {
      groups.push({
        group: $t('payment.merchant.app.app.groupNotifyDevice'),
        color: 'purple',
        cards: notifyCards,
      });
    }

    const manageCards: WorkbenchTile[] = [];
    if (hasPermission(PermCodes.Merchant.App.MANAGE)) {
      manageCards.push({
        key: 'edit',
        title: $t('payment.merchant.app.app.edit'),
        icon: 'ant-design:edit-outlined',
        description: $t('payment.merchant.app.app.editDesc'),
      });
      if (appInfo.value.defaultApp) {
        manageCards.push({
          key: 'cancelDefault',
          title: $t('payment.merchant.app.app.cancelDefault'),
          icon: 'ant-design:star-filled',
          description: $t('payment.merchant.app.app.cancelDefaultDesc'),
          // 已默认=当前生效态, 主色强调; 红色只留给删除
          active: true,
        });
      } else {
        manageCards.push({
          key: 'setDefault',
          title: $t('payment.merchant.app.app.setDefault'),
          icon: 'ant-design:star-outlined',
          description: $t('payment.merchant.app.app.setDefaultDesc'),
        });
      }
      manageCards.push({
        key: 'delete',
        title: $t('payment.merchant.app.app.delete'),
        icon: 'ant-design:delete-outlined',
        description: $t('payment.merchant.app.app.deleteDesc'),
        danger: true,
      });
    }
    if (manageCards.length > 0) {
      groups.push({
        group: $t('payment.merchant.app.app.groupManage'),
        color: 'blue',
        cards: manageCards,
      });
    }

    return groups;
  });

  /**
   * 加载当前应用信息
   */
  async function loadAppInfo() {
    if (!mchNo.value || !appId.value) {
      return;
    }
    loading.value = true;
    try {
      const { data } = await MchAppInfoApi.page({
        mchNo: mchNo.value,
        current: 1,
        size: 200,
      });
      const records = data?.records || [];
      const app = records.find((a) => a.appId === appId.value);
      if (!app) {
        message.warning($t('payment.merchant.app.app.appNotFound'));
        router.push({ path: '/payment/merchant/app', query: { mchNo: mchNo.value } });
        return;
      }
      appInfo.value = app;
      // 页签标题动态化为「{应用名} · 应用配置」(名字超长由页签栏截断)
      setTabObjectTitle(app.appName || '');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 返回应用列表
   */
  function handleBack() {
    router.push({
      path: '/payment/merchant/app',
      query: { mchNo: mchNo.value },
    });
  }

  /**
   * 功能卡点击（磁贴 select 事件按 key 分发，原路由/动作元数据收敛到分发处）
   */
  function handleCardSelect(key: string) {
    switch (key) {
      case 'cancelDefault': {
        handleCancelDefault();
        break;
      }
      case 'cashier': {
        router.push({
          path: '/payment/merchant/cashier',
          query: { mchNo: mchNo.value, appId: appId.value },
        });
        break;
      }
      case 'delete': {
        handleDelete();
        break;
      }
      case 'easypay': {
        router.push({
          path: '/payment/merchant/easypay',
          query: { mchNo: mchNo.value, appId: appId.value },
        });
        break;
      }
      case 'edit': {
        appEditRef.value?.showEdit(mchNo.value, appInfo.value);
        break;
      }
      case 'gatewayPayConfig': {
        router.push({
          path: '/payment/merchant/gateway-config',
          query: { mchNo: mchNo.value, appId: appId.value },
        });
        break;
      }
      case 'notify': {
        notifyDrawerVisible.value = true;
        break;
      }
      case 'payRoute': {
        router.push({
          path: '/payment/route',
          query: { mchNo: mchNo.value, appId: appId.value },
        });
        break;
      }
      case 'setDefault': {
        handleSetDefault();
        break;
      }
    }
  }

  /**
   * 设为默认
   */
  function handleSetDefault() {
    confirm({
      content: $t('payment.merchant.app.app.confirmSetDefault'),
      onOk() {
        return MchAppInfoApi.setDefault(appInfo.value.id!).then(() => {
          message.success($t('common.operationSuccess'));
          return loadAppInfo();
        });
      },
    });
  }

  /**
   * 取消默认
   */
  function handleCancelDefault() {
    confirm({
      content: $t('payment.merchant.app.app.confirmCancelDefault'),
      onOk() {
        return MchAppInfoApi.clearDefault(appInfo.value.id!).then(() => {
          message.success($t('common.operationSuccess'));
          return loadAppInfo();
        });
      },
    });
  }

  /**
   * 删除应用（强确认：须输入应用名称匹配）
   *
   * 默认应用禁止删除(与 MchAppInfoService.delete 后端校验对齐),
   * 需先把其他应用设为默认, 再删除当前应用。
   */
  function handleDelete() {
    if (appInfo.value.defaultApp) {
      message.warning($t('payment.merchant.app.app.deleteDefaultBlocked'));
      return;
    }
    openDeleteConfirm({
      name: appInfo.value.appName || '',
      verificationText: appInfo.value.appName || '',
      onConfirm: async () => {
        await MchAppInfoApi.delete(appInfo.value.id!);
        message.success($t('common.operationSuccess'));
        router.push({
          path: '/payment/merchant/app',
          query: { mchNo: mchNo.value },
        });
      },
    });
  }

  /**
   * 编辑保存后刷新
   */
  function handleEditOk() {
    loadAppInfo();
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadAppInfo();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingAppContext')"
    :back-text="$t('payment.merchant.app.app.backToAppList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3">
    <!-- 顶栏对齐对接配置等下级页：a-card title，text-lg -->
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="rounded-xl shadow-sm">
        <template #title>
          <!-- 国际化：应用配置 -->
          <PageTitleBar
            back
            :title="$t('payment.merchant.app.app.workbenchTitle')"
            :name="appInfo.appName || ''"
            @back="handleBack"
          >
            <!-- 默认应用标签 -->
            <a-tag v-if="appInfo.defaultApp" color="processing" class="!m-0 !text-xs">
              {{ $t('payment.merchant.app.app.defaultTag') }}
            </a-tag>
          </PageTitleBar>
        </template>

        <!-- 功能分组磁贴 -->
        <WorkbenchTileGrid :groups="functionCards" @select="handleCardSelect" />
      </a-card>
    </a-spin>

    <MchAppInfoEdit ref="appEditRef" @ok="handleEditOk" />

    <MchAppNotifyConfig v-model:visible="notifyDrawerVisible" :app-id="appInfo.appId" :app-name="appInfo.appName" />
  </div>
</template>

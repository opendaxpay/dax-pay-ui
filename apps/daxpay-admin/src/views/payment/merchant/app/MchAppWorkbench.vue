<script lang="ts" setup>
  import type { WorkbenchTile, WorkbenchTileGroup } from '@daxpay/ui-biz/components/workbench-tile';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { WorkbenchTileGrid } from '@daxpay/ui-biz/components/workbench-tile';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { DashboardDeviceApi, type MchDeviceCountResult } from '#/api/payment/dashboard/device-dashboard.api';
  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchAppDeviceConfigModal from './MchAppDeviceConfigModal.vue';
  import MchAppInfoEdit from './MchAppInfoEdit.vue';

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
  // 设备计数(「收款设备」磁贴台数角标, 加载失败时缺省不展示)
  const deviceCounts = ref<MchDeviceCountResult>({});
  const appEditRef = ref<InstanceType<typeof MchAppInfoEdit>>();
  const deviceConfigRef = ref<InstanceType<typeof MchAppDeviceConfigModal>>();
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

    // 虚拟设备: 收款之后的联动——本商户虚拟设备(手机 APP 变云音箱/云打印)
    const deviceCards: WorkbenchTile[] = [];
    if (hasPermission(PermCodes.Device.Virtual.VIEW)) {
      deviceCards.push({
        key: 'virtualDevice',
        // 虚拟设备 — 标题与菜单 i18n_key 一致(跳设备列表页, URL 带 mchNo 预置该商户筛选)
        title: $t('menu.device.virtual'),
        icon: 'ant-design:sound-outlined',
        description: $t('payment.merchant.app.app.cardAudioDeviceDesc'),
        // 台数角标(存量总数)
        count: deviceCounts.value.virtualDeviceCount,
        countUnit: $t('payment.merchant.app.app.unitDevice'),
      });
    }
    // 收款播报配置: 弹窗(播报/打印开关 + 门店严格匹配 + 打印版式), 按应用维度独立保存
    if (hasPermission(PermCodes.Merchant.App.VIEW)) {
      deviceCards.push({
        key: 'deviceConfig',
        title: $t('payment.device.virtual.appConfig.title'),
        icon: 'ant-design:notification-outlined',
        description: $t('payment.device.virtual.appConfig.broadcastHint'),
      });
    }
    if (deviceCards.length > 0) {
      groups.push({
        group: $t('payment.merchant.app.app.groupDevice'),
        color: 'purple',
        cards: deviceCards,
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
   * 加载当前应用信息(按 appId 单查, 校验返回商户与 URL 商户一致, 防跨商户串号)
   */
  async function loadAppInfo() {
    if (!mchNo.value || !appId.value) {
      return;
    }
    loading.value = true;
    try {
      const { data } = await MchAppInfoApi.getByAppId(appId.value);
      if (!data || !data.appId || data.mchNo !== mchNo.value) {
        // 应用不存在或与当前商户不匹配, 返回列表
        message.warning($t('payment.merchant.app.app.appNotFound'));
        router.push({ path: '/payment/merchant/app', query: { mchNo: mchNo.value } });
        return;
      }
      appInfo.value = data;
      // 页签标题动态化为「{应用名} · 应用配置」(名字超长由页签栏截断)
      setTabObjectTitle(data.appName || '');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载设备计数(「收款设备」磁贴数量标签, 失败静默不显示数量)
   */
  function loadDeviceCounts() {
    DashboardDeviceApi.deviceCounts(mchNo.value)
      .then(({ data }) => {
        deviceCounts.value = data || {};
      })
      .catch(() => {
        // 角标为辅助信息, 拉取失败保持缺省不展示
        deviceCounts.value = {};
      });
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
      case 'deviceConfig': {
        deviceConfigRef.value?.show({ appId: appId.value, appName: appInfo.value.appName });
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
      case 'virtualDevice': {
        // 虚拟设备列表页(平台视角, URL 带 mchNo 预置该商户筛选)
        router.push({ path: '/device/virtual', query: { mchNo: mchNo.value } });
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
    loadDeviceCounts();
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

    <MchAppDeviceConfigModal ref="deviceConfigRef" />
    <MchAppInfoEdit ref="appEditRef" @ok="handleEditOk" />
  </div>
</template>

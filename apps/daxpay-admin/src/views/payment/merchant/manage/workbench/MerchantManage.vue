<script lang="ts" setup>
  import type { WorkbenchTile, WorkbenchTileGroup } from '@daxpay/ui-biz/components/workbench-tile';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { WorkbenchTileGrid } from '@daxpay/ui-biz/components/workbench-tile';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { DashboardDeviceApi, type MchDeviceCountResult } from '#/api/payment/dashboard/device-dashboard.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MerchantManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { message: msg } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const mchNo = ref<string>('');
  const merchantInfo = ref<MerchantInfo>({});
  // 设备与支付应用计数(虚拟设备台数/微信应用数/抖音应用数, 加载失败时缺省不展示角标)
  const deviceCounts = ref<MchDeviceCountResult>({});
  // 页签标题动态化为「{商户名} · 商户工作台」
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.merchant.workbench.workbench.title'));

  /**
   * 功能卡片配置: 五组制(基础/支付/收银与设备/接入/危险)
   *
   * 收银与设备组收纳收款端实体(系统终端/虚拟设备), 与支付通路配置分离;
   * 微信/抖音应用卡与虚拟设备卡带数字角标(存量计数, 取数见 loadDeviceCounts)。
   */
  const functionCards = computed((): WorkbenchTileGroup[] => {
    const groups: WorkbenchTileGroup[] = [];

    // 基础管理: 商户主体档案与子资源
    const basicCards: WorkbenchTile[] = [
      {
        key: 'mchInfo',
        // 商户信息
        title: $t('payment.merchant.workbench.workbench.cardMchInfo'),
        icon: 'ant-design:info-circle-outlined',
        // 商户号、名称、类型、状态等基本信息
        description: $t('payment.merchant.workbench.workbench.cardMchInfoDesc'),
      },
      {
        key: 'user',
        title: $t('payment.merchant.workbench.workbench.cardUser'),
        icon: 'ant-design:user-outlined',
        description: $t('payment.merchant.workbench.workbench.cardUserDesc'),
      },
      {
        key: 'store',
        title: $t('payment.merchant.workbench.workbench.cardStore'),
        icon: 'ant-design:environment-outlined',
        description: $t('payment.merchant.workbench.workbench.cardStoreDesc'),
      },
    ];
    groups.push({
      group: $t('payment.merchant.workbench.workbench.groupBasic'),
      color: 'blue',
      cards: basicCards,
    });

    // 支付配置(收款通路: 通道商户 / 应用 / 微信抖音开放应用)
    const paymentCards: WorkbenchTile[] = [
      {
        key: 'channelMerchant',
        // 通道商户（与菜单一致）
        title: $t('payment.merchant.workbench.workbench.cardChannelMerchant'),
        icon: 'ant-design:shop-outlined',
        // 商户在各支付通道的商户号配置与管理
        description: $t('payment.merchant.workbench.workbench.cardChannelMerchantDesc'),
      },
      {
        key: 'app',
        // 应用管理
        title: $t('payment.merchant.workbench.workbench.cardApp'),
        icon: 'ant-design:appstore-outlined',
        // 商户应用创建与管理
        description: $t('payment.merchant.workbench.workbench.cardAppDesc'),
      },
      {
        key: 'wxApp',
        // 支付应用(微信) — 跳转全局 Hub 商户 Tab
        title: $t('payment.merchant.workbench.workbench.cardWxApp'),
        icon: 'lucide:message-circle',
        // 管理该商户的微信公众号 / 小程序等开放应用
        description: $t('payment.merchant.workbench.workbench.cardWxAppDesc'),
        // 应用数角标(存量总数)
        count: deviceCounts.value.wxAppCount,
        countUnit: $t('payment.merchant.workbench.workbench.unitPiece'),
      },
      {
        key: 'dyApp',
        // 支付应用(抖音) — 跳转全局 Hub 商户 Tab
        title: $t('payment.merchant.workbench.workbench.cardDyApp'),
        icon: 'lucide:music-2',
        // 管理该商户的抖音小程序 / 移动应用 / 网页应用等开放应用
        description: $t('payment.merchant.workbench.workbench.cardDyAppDesc'),
        count: deviceCounts.value.dyAppCount,
        countUnit: $t('payment.merchant.workbench.workbench.unitPiece'),
      },
    ];
    groups.push({
      group: $t('payment.merchant.workbench.workbench.groupPayment'),
      color: 'green',
      cards: paymentCards,
    });

    // 收银与设备(收款端实体: 系统终端 / 虚拟设备)
    const deviceCards: WorkbenchTile[] = [
      {
        key: 'terminal',
        // 系统终端
        title: $t('payment.merchant.workbench.workbench.cardTerminal'),
        icon: 'ant-design:monitor-outlined',
        // 商户逻辑终端编号与通道终端绑定管理
        description: $t('payment.merchant.workbench.workbench.cardTerminalDesc'),
      },
    ];
    if (hasPermission(PermCodes.Device.Virtual.VIEW)) {
      deviceCards.push({
        key: 'virtualDevice',
        // 虚拟设备 — 标题与菜单 i18n_key 一致(跳转设备管理列表页, URL 带 mchNo 预置筛选)
        title: $t('menu.device.virtual'),
        icon: 'lucide:monitor-speaker',
        // 该商户名下绑定虚拟设备(收款播报 APP)的台账与运维
        description: $t('payment.merchant.workbench.workbench.cardVirtualDeviceDesc'),
        // 台数角标(存量总数)
        count: deviceCounts.value.virtualDeviceCount,
        countUnit: $t('payment.merchant.workbench.workbench.unitDevice'),
      });
    }
    if (deviceCards.length > 0) {
      groups.push({
        group: $t('payment.merchant.workbench.workbench.groupDeviceCashier'),
        color: 'orange',
        cards: deviceCards,
      });
    }

    // 接入配置(系统对接与准入: 密钥 / 域名验证)
    const accessCards: WorkbenchTile[] = [
      {
        key: 'credentialConfig',
        title: $t('payment.merchant.workbench.workbench.cardCredentialConfig'),
        icon: 'ant-design:key-outlined',
        description: $t('payment.merchant.workbench.workbench.cardCredentialConfigDesc'),
      },
      {
        key: 'wxDomainVerify',
        title: $t('payment.merchant.workbench.workbench.cardWxDomainVerify'),
        icon: 'ant-design:safety-certificate-outlined',
        description: $t('payment.merchant.workbench.workbench.cardWxDomainVerifyDesc'),
      },
    ];
    groups.push({
      group: $t('payment.merchant.workbench.workbench.groupAccess'),
      color: 'gray',
      cards: accessCards,
    });

    // 危险操作: 仅持有商户管理权限的用户可见(删除入口从列表操作列移入此处)
    if (hasPermission(PermCodes.Merchant.Info.MANAGE)) {
      groups.push({
        group: $t('payment.merchant.workbench.workbench.groupDanger'),
        color: 'red',
        cards: [
          {
            key: 'deleteMerchant',
            // 删除商户
            title: $t('payment.merchant.workbench.workbench.cardDeleteMerchant'),
            icon: 'ant-design:delete-outlined',
            // 删除商户及其全部关联配置, 不可恢复
            description: $t('payment.merchant.workbench.workbench.cardDeleteMerchantDesc'),
            danger: true,
          },
        ],
      });
    }

    return groups;
  });

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo!;
    loadMerchantInfo();
    loadDeviceCounts();
  });

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    loading.value = true;
    MerchantApi.findByMchNo(mchNo.value)
      .then(({ data }) => {
        if (data) {
          merchantInfo.value = data;
          // 页签标题动态化为「{商户名} · 商户工作台」(名字超长由页签栏截断)
          setTabObjectTitle(data.mchName || '');
          mchNo.value = data.mchNo || '';
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 加载设备与支付应用计数(收银与设备/支付配置组磁贴角标, 失败静默不展示)
   */
  function loadDeviceCounts() {
    DashboardDeviceApi.deviceCounts(mchNo.value)
      .then(({ data }) => {
        deviceCounts.value = data || {};
      })
      .catch(() => {
        // 角标为辅助信息, 拉取失败保持缺省不展示, 不影响页面主体
      });
  }

  /**
   * 功能卡点击分发(磁贴 select 事件按 key 分发, 跳转携带 mchNo 预置筛选)
   */
  function handleCardSelect(key: string) {
    // 删除商户卡片 → 强确认删除
    if (key === 'deleteMerchant') {
      handleDeleteMerchant();
      return;
    }
    const routeMap: Record<string, { path: string; query?: Record<string, string> }> = {
      app: { path: '/payment/merchant/app' },
      channelMerchant: { path: '/payment/global/channel-merchant' },
      credentialConfig: { path: '/payment/merchant/manage/credential' },
      dyApp: { path: '/payment/douyin/app', query: { tab: 'merchant' } },
      mchInfo: { path: '/payment/merchant/manage/info' },
      store: { path: '/payment/merchant/store' },
      terminal: { path: '/payment/device/terminal/system' },
      user: { path: '/payment/merchant/user' },
      virtualDevice: { path: '/device/virtual/list' },
      wxApp: { path: '/payment/wx/app', query: { tab: 'merchant' } },
      wxDomainVerify: { path: '/payment/merchant/manage/wx-verify' },
    };
    const target = routeMap[key];
    if (target) {
      router.push({
        path: target.path,
        query: { mchNo: mchNo.value, ...target.query },
      });
    }
  }

  /**
   * 删除商户（强确认：用户必须输入商户名称匹配才能确认，成功后返回商户列表）
   *
   * 注销语义: 关联用户不阻塞, 随主体自动级联注销,
   * 弹窗描述须明示连带删除用户账号并清除敏感信息。
   */
  function handleDeleteMerchant() {
    const merchant = merchantInfo.value;
    openDeleteConfirm({
      name: merchant.mchName || '',
      verificationText: merchant.mchName || '',
      title: $t('payment.merchant.base.action.delete'),
      descriptionKey: 'payment.merchant.base.action.deleteDeregisterDesc',
      onConfirm: () =>
        MerchantApi.delete(merchant.id!).then(() => {
          msg.success($t('common.deleteSuccess'));
          router.push('/payment/merchant');
        }),
    });
  }

  /**
   * 返回商户列表
   */
  function handleBack() {
    router.push('/payment/merchant');
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
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="min-h-[calc(100vh-120px)] rounded-2xl bg-muted/80 shadow-sm">
        <div class="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div class="flex items-center gap-4">
            <a-button
              type="text"
              class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent"
              @click="handleBack"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-xl" />
              </template>
            </a-button>
            <div>
              <span class="text-2xl font-bold text-foreground">{{
                $t('payment.merchant.workbench.workbench.title')
              }}</span>
              <span v-if="merchantInfo.mchName" class="ml-2 text-base text-muted-foreground"
                >({{ merchantInfo.mchName }})</span
              >
            </div>
          </div>
        </div>

        <!-- 功能分组磁贴 -->
        <WorkbenchTileGrid :groups="functionCards" @select="handleCardSelect" />
      </a-card>
    </a-spin>
  </div>
</template>

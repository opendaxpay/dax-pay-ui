<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchAppInfoEdit from './MchAppInfoEdit.vue';
  import MchAppNotifyConfig from './MchAppNotifyConfig.vue';

  defineOptions({ name: 'MchAppWorkbench' });

  type GroupColor = 'blue' | 'green' | 'purple';

  type WorkbenchCard = {
    key: string;
    title: string;
    icon: string;
    description: string;
    /** 有 route 则跳转；否则走 action */
    route?: string;
    action?: 'notify' | 'edit' | 'setDefault' | 'cancelDefault' | 'delete';
  };

  type WorkbenchGroup = {
    group: string;
    color: GroupColor;
    cards: WorkbenchCard[];
  };

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
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

  /**
   * 功能卡片（权限过滤后展示），视觉对齐商户工作台
   */
  const functionCards = computed((): WorkbenchGroup[] => {
    const groups: WorkbenchGroup[] = [];

    const paymentCards: WorkbenchCard[] = [];
    if (hasPermission(PermCodes.Merchant.AppRoute.VIEW)) {
      paymentCards.push({
        key: 'payRoute',
        title: $t('payment.merchant.app.app.payRoute'),
        icon: 'ant-design:node-index-outlined',
        description: $t('payment.merchant.app.app.payRouteDesc'),
        route: '/payment/route',
      });
    }
    if (hasPermission(PermCodes.Merchant.GatewayAggregate.VIEW)) {
      paymentCards.push({
        key: 'aggregateScan',
        title: $t('payment.merchant.app.app.aggregateScan'),
        icon: 'ant-design:qrcode-outlined',
        description: $t('payment.merchant.app.app.aggregateScanDesc'),
        route: '/payment/merchant/aggregate',
      });
    }
    if (hasPermission(PermCodes.Merchant.GatewayCode.VIEW)) {
      paymentCards.push({
        key: 'codePayConfig',
        title: $t('payment.merchant.app.app.codePayConfig'),
        icon: 'ant-design:mobile-outlined',
        description: $t('payment.merchant.app.app.codePayConfigDesc'),
        route: '/payment/merchant/code-config',
      });
    }
    if (hasPermission(PermCodes.Merchant.GatewayCashier.VIEW)) {
      paymentCards.push({
        key: 'cashier',
        title: $t('payment.merchant.app.app.cashierConfig'),
        icon: 'ant-design:desktop-outlined',
        description: $t('payment.merchant.app.app.cashierConfigDesc'),
        route: '/payment/merchant/cashier',
      });
    }
    if (hasPermission(PermCodes.Merchant.NotifyConfig.VIEW)) {
      paymentCards.push({
        key: 'notify',
        title: $t('payment.merchant.app.app.notifyConfig'),
        icon: 'ant-design:notification-outlined',
        description: $t('payment.merchant.app.app.notifyConfigDesc'),
        action: 'notify',
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
        route: '/payment/merchant/easypay',
      });
    }
    if (paymentCards.length > 0) {
      groups.push({
        group: $t('payment.merchant.app.app.groupConfig'),
        color: 'green',
        cards: paymentCards,
      });
    }

    const manageCards: WorkbenchCard[] = [];
    if (hasPermission(PermCodes.Merchant.App.MANAGE)) {
      manageCards.push({
        key: 'edit',
        title: $t('payment.merchant.app.app.edit'),
        icon: 'ant-design:edit-outlined',
        description: $t('payment.merchant.app.app.editDesc'),
        action: 'edit',
      });
      if (appInfo.value.defaultApp) {
        manageCards.push({
          key: 'cancelDefault',
          title: $t('payment.merchant.app.app.cancelDefault'),
          icon: 'ant-design:star-filled',
          description: $t('payment.merchant.app.app.cancelDefaultDesc'),
          action: 'cancelDefault',
        });
      } else {
        manageCards.push({
          key: 'setDefault',
          title: $t('payment.merchant.app.app.setDefault'),
          icon: 'ant-design:star-outlined',
          description: $t('payment.merchant.app.app.setDefaultDesc'),
          action: 'setDefault',
        });
      }
      manageCards.push({
        key: 'delete',
        title: $t('payment.merchant.app.app.delete'),
        icon: 'ant-design:delete-outlined',
        description: $t('payment.merchant.app.app.deleteDesc'),
        action: 'delete',
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
   * 组标题竖条颜色
   */
  function getGroupColorClass(color: GroupColor) {
    const map: Record<GroupColor, string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      purple: 'bg-purple-500',
    };
    return map[color];
  }

  /**
   * 图标背景色
   */
  function getIconBgClass(color: GroupColor) {
    const map: Record<GroupColor, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return map[color];
  }

  /**
   * 危险操作卡：删除、取消默认用红色样式；设为默认保持正常色
   */
  function isDangerCard(card: WorkbenchCard) {
    return card.action === 'delete' || card.action === 'cancelDefault';
  }

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
   * 功能卡点击
   */
  function handleCardClick(card: WorkbenchCard) {
    if (card.route) {
      router.push({
        path: card.route,
        query: { mchNo: mchNo.value, appId: appId.value },
      });
      return;
    }
    switch (card.action) {
      case 'notify': {
        notifyDrawerVisible.value = true;
        break;
      }
      case 'edit': {
        appEditRef.value?.showEdit(mchNo.value, appInfo.value);
        break;
      }
      case 'setDefault': {
        handleSetDefault();
        break;
      }
      case 'cancelDefault': {
        handleCancelDefault();
        break;
      }
      case 'delete': {
        handleDelete();
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
   * 删除应用
   *
   * 默认应用禁止删除(与 MchAppInfoService.delete 后端校验对齐),
   * 需先把其他应用设为默认, 再删除当前应用。
   */
  function handleDelete() {
    if (appInfo.value.defaultApp) {
      message.warning($t('payment.merchant.app.app.deleteDefaultBlocked'));
      return;
    }
    confirm({
      content: $t('payment.merchant.app.app.confirmDelete'),
      onOk() {
        return MchAppInfoApi.delete(appInfo.value.id!).then(() => {
          message.success($t('common.operationSuccess'));
          router.push({
            path: '/payment/merchant/app',
            query: { mchNo: mchNo.value },
          });
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
  <div v-else class="m-4">
    <!-- 顶栏对齐对接配置等下级页：a-card title，text-lg -->
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="rounded-xl shadow-sm">
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
            <!-- 国际化：应用配置 -->
            <span class="text-lg font-bold text-foreground">
              {{ $t('payment.merchant.app.app.workbenchTitle') }}
            </span>
            <span v-if="appInfo.appName" class="text-sm text-muted-foreground">
              ({{ appInfo.appName }})
            </span>
            <a-tag v-if="appInfo.defaultApp" color="processing" class="!m-0 !text-xs">
              {{ $t('payment.merchant.app.app.defaultTag') }}
            </a-tag>
          </div>
        </template>

        <!-- 功能分组磁贴 -->
        <div class="space-y-10 py-2">
          <div v-for="group in functionCards" :key="group.group">
            <div class="mb-5 flex items-center gap-3 px-2">
              <div class="h-5 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)" />
              <span class="text-lg font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
            </div>

            <div class="card-grid">
              <a-card
                v-for="card in group.cards"
                :key="card.key"
                hoverable
                class="mch-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                :class="{ 'mch-card--danger': isDangerCard(card) }"
                :styles="{ body: { padding: '24px 20px' } }"
                @click="handleCardClick(card)"
              >
                <div class="flex flex-col items-center text-center">
                  <div
                    class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                    :class="
                      isDangerCard(card)
                        ? 'bg-destructive/10 text-destructive'
                        : getIconBgClass(group.color)
                    "
                  >
                    <IconifyIcon :icon="card.icon" class="h-7 w-7" />
                  </div>

                  <div
                    class="mb-1.5 text-base font-bold transition-colors duration-300"
                    :class="
                      isDangerCard(card)
                        ? 'text-destructive'
                        : 'text-foreground group-hover:text-primary'
                    "
                  >
                    {{ card.title }}
                  </div>
                  <a-tooltip :title="card.description" placement="bottom">
                    <div
                      class="card-desc line-clamp-1 text-xs leading-relaxed transition-colors duration-300"
                      :class="
                        isDangerCard(card)
                          ? 'text-destructive/80 group-hover:text-destructive'
                          : 'text-muted-foreground group-hover:text-foreground'
                      "
                    >
                      {{ card.description }}
                    </div>
                  </a-tooltip>
                </div>

                <div
                  class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
                  :class="isDangerCard(card) ? 'bg-destructive' : getGroupColorClass(group.color)"
                />
              </a-card>
            </div>
          </div>

          <div
            v-if="functionCards.length === 0"
            class="py-16 text-center text-sm text-muted-foreground"
          >
            {{ $t('payment.merchant.app.app.noActions') }}
          </div>
        </div>
      </a-card>
    </a-spin>

    <MchAppInfoEdit ref="appEditRef" @ok="handleEditOk" />

    <MchAppNotifyConfig
      v-model:visible="notifyDrawerVisible"
      :app-id="appInfo.appId"
      :app-name="appInfo.appName"
    />
  </div>
</template>

<style scoped>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 220px);
    gap: 24px;
    justify-content: center;
  }

  .mch-card {
    max-height: 200px;
  }

  .card-desc {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>

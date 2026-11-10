<script lang="ts" setup>
  import type { MchStoreInfoResult, StoreOverviewResult } from '#/api/payment/merchant/store.api';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchStoreInfoEdit from '../MchStoreInfoEdit.vue';
  import StoreBindModal from './StoreBindModal.vue';
  import StoreTerminalDefaultModal from './StoreTerminalDefaultModal.vue';

  /**
   * 门店详情工作台(运营端隐藏子页, 从门店管理卡片墙「进入工作台」进入)
   *
   * 形态对齐商户工作台同款顶栏 + 分组磁贴卡片:
   * 收银与设备分组(码牌/系统终端计数来自 overview, 收款设备计数经虚拟设备分页接口 total 静默取数)
   * + 快捷绑定入口(商户名下未分配门店的收款设备/码牌/系统终端一键绑到本店)
   * + 默认设置组(默认应用/默认终端) + 门店管理组(门店信息/默认门店/删除)。
   * 开源版裁剪(对照 plus): 无云音箱/云打印与打印模板域。
   */
  defineOptions({ name: 'StoreWorkbench' });

  type GroupColor = 'blue' | 'gray' | 'orange' | 'purple';

  type WorkbenchCard = {
    /** 当前生效态强调(默认门店已默认时主色系) */
    active?: boolean;
    /** 数量标签(可选, 存量语义中性灰, undefined 不渲染) */
    count?: number;
    /** 数量单位(如「台」「张」) */
    countUnit?: string;
    /** 危险操作卡(删除等)红色系 */
    danger?: boolean;
    description: string;
    icon: string;
    key: string;
    title: string;
  };

  type WorkbenchGroup = {
    cards: WorkbenchCard[];
    color: GroupColor;
    group: string;
  };

  const route = useRoute();
  const router = useRouter();

  // 门店参数从路由 query 获取(门店主键 id + 门店号 + 商户号)
  const routeContext = useRequiredRouteQuery({
    keys: ['id', 'storeNo', 'mchNo'],
    messageKey: 'payment.common.route.missingStoreContext',
    fallbackPath: () => {
      // 保留 mchNo 时回门店列表, 否则回商户列表
      const mchNo = String(route.query.mchNo ?? '').trim();
      return mchNo ? { path: '/payment/merchant/store', query: { mchNo } } : '/payment/merchant';
    },
  });

  const { hasPermission } = usePermission();
  const { confirm, message } = useMessage();
  // 页签标题动态化为「{门店名} · 门店工作台」
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.merchant.store.workbench.title'));

  const loading = ref(false);
  const storeInfo = ref<MchStoreInfoResult>({});
  const overview = ref<StoreOverviewResult>({});
  // 收款设备(虚拟设备)绑定数(分页接口 total 静默取数, 失败不展示)
  const deviceCount = ref<number | undefined>(undefined);
  const storeEditRef = ref<InstanceType<typeof MchStoreInfoEdit>>();
  const bindModalRef = ref<InstanceType<typeof StoreBindModal>>();
  // 默认终端设置弹窗(默认设置组一级操作)
  const terminalDefaultRef = ref<InstanceType<typeof StoreTerminalDefaultModal>>();

  // 默认支付应用设置弹窗(工作台一级操作)
  const appModalOpen = ref(false);
  const appSaving = ref(false);
  const selectedAppId = ref<string | undefined>();
  const appOptions = ref<{ label: string; value: string }[]>([]);

  const storeId = computed(() => routeContext.query.value.id);
  const storeNo = computed(() => routeContext.query.value.storeNo);
  const mchNo = computed(() => routeContext.query.value.mchNo);
  const canManageStore = computed(() => hasPermission(PermCodes.Merchant.Store.MANAGE));

  /**
   * 功能卡片(收银与设备 + 快捷绑定 + 默认设置 + 门店管理, 数量标签来自 overview/设备分页)
   */
  const functionCards = computed((): WorkbenchGroup[] => {
    const o = overview.value;
    // 收银与设备(本店绑定的收款设备与码牌)
    const cashierCards: WorkbenchCard[] = [];
    if (hasPermission(PermCodes.Device.Virtual.VIEW)) {
      cashierCards.push({
        key: 'device',
        // 收款设备(虚拟设备)
        title: $t('payment.merchant.store.workbench.tileDevice'),
        icon: 'lucide:monitor-speaker',
        description: $t('payment.merchant.store.workbench.tileDeviceDesc'),
        count: deviceCount.value,
        countUnit: $t('payment.merchant.store.workbench.countUnitDevice'),
      });
    }
    if (hasPermission(PermCodes.Device.QrCode.VIEW)) {
      cashierCards.push({
        key: 'qrcode',
        title: $t('payment.merchant.store.workbench.tileQrcode'),
        icon: 'lucide:qr-code',
        description: $t('payment.merchant.store.workbench.tileQrcodeDesc'),
        count: o.qrCodeCount,
        countUnit: $t('payment.merchant.store.workbench.countUnitQrcode'),
      });
    }
    if (hasPermission(PermCodes.Merchant.Terminal.VIEW)) {
      cashierCards.push({
        key: 'terminal',
        // 系统终端
        title: $t('payment.merchant.store.workbench.tileTerminal'),
        icon: 'ant-design:monitor-outlined',
        description: $t('payment.merchant.store.workbench.tileTerminalDesc'),
        count: o.terminalCount,
        countUnit: $t('payment.merchant.store.workbench.countUnitTerminal'),
      });
    }
    // 快捷绑定卡(弹窗内选商户名下未分配门店的收款设备/码牌/系统终端绑到本店)
    const bindCards: WorkbenchCard[] = [];
    if (hasPermission(PermCodes.Device.Virtual.MANAGE)) {
      bindCards.push({
        key: 'bindDevice',
        title: $t('payment.merchant.store.workbench.tileBindDevice'),
        icon: 'ant-design:link-outlined',
        description: $t('payment.merchant.store.workbench.tileBindDeviceDesc'),
      });
    }
    if (hasPermission(PermCodes.Device.QrCode.MANAGE)) {
      bindCards.push({
        key: 'bindQrcode',
        title: $t('payment.merchant.store.workbench.tileBindQrcode'),
        icon: 'ant-design:plus-square-outlined',
        description: $t('payment.merchant.store.workbench.tileBindQrcodeDesc'),
      });
    }
    if (hasPermission(PermCodes.Merchant.Terminal.MANAGE)) {
      bindCards.push({
        key: 'bindTerminal',
        title: $t('payment.merchant.store.workbench.tileBindTerminal'),
        icon: 'lucide:link-2',
        description: $t('payment.merchant.store.workbench.tileBindTerminalDesc'),
      });
    }
    // 默认设置组(一级操作: 默认应用/默认终端, 当前值直接写在卡片描述上)
    const defaultCards: WorkbenchCard[] = [];
    if (canManageStore.value) {
      defaultCards.push({
        key: 'defaultApp',
        title: $t('payment.merchant.store.workbench.tileDefaultApp'),
        icon: 'ant-design:appstore-outlined',
        description: o.storeAppId
          ? $t('payment.merchant.store.workbench.tileDefaultAppStore', {
              name: o.storeAppName || o.storeAppId,
            })
          : o.mchDefaultAppId
            ? $t('payment.merchant.store.workbench.tileDefaultAppFollow', {
                name: o.mchDefaultAppName || o.mchDefaultAppId,
              })
            : $t('payment.merchant.store.workbench.tileDefaultAppNone'),
      });
    }
    if (hasPermission(PermCodes.Merchant.Terminal.MANAGE)) {
      defaultCards.push({
        key: 'defaultTerminal',
        title: $t('payment.merchant.store.workbench.tileDefaultTerminal'),
        icon: 'ant-design:desktop-outlined',
        // 当前默认终端名(号), 停用态追加后缀, 未设置给引导文案
        description: o.defaultTerminalNo
          ? $t('payment.merchant.store.workbench.tileDefaultTerminalSet', {
              name: o.defaultTerminalName || o.defaultTerminalNo,
              no: o.defaultTerminalNo,
            }) +
            (o.defaultTerminalEnable === false
              ? $t('payment.merchant.store.workbench.tileDefaultTerminalDisabledSuffix')
              : '')
          : $t('payment.merchant.store.workbench.tileDefaultTerminalNone'),
      });
    }
    // 门店编辑入口卡片化(顶栏不放「编辑」按钮, 对齐商户工作台管理操作先例)
    const manageCards: WorkbenchCard[] = hasPermission(PermCodes.Merchant.Store.MANAGE)
      ? [
          {
            key: 'storeInfo',
            title: $t('payment.merchant.store.workbench.tileStoreInfo'),
            icon: 'ant-design:shop-outlined',
            description: $t('payment.merchant.store.workbench.tileStoreInfoDesc'),
          },
          {
            key: 'defaultStore',
            title: $t('payment.merchant.store.store.defaultStore'),
            // 已默认用实心星 + 主色强调(当前生效态), 未默认保持普通色与空心星; 红色只留给删除
            icon: storeInfo.value.defaultStore ? 'ant-design:star-filled' : 'ant-design:star-outlined',
            description: storeInfo.value.defaultStore
              ? $t('payment.merchant.store.workbench.tileDefaultStoreActiveDesc')
              : $t('payment.merchant.store.workbench.tileDefaultStoreDesc'),
            active: !!storeInfo.value.defaultStore,
          },
          {
            key: 'deleteStore',
            title: $t('payment.merchant.store.workbench.tileDeleteStore'),
            icon: 'ant-design:delete-outlined',
            description: $t('payment.merchant.store.workbench.tileDeleteStoreDesc'),
            danger: true,
          },
        ]
      : [];
    return [
      ...(cashierCards.length > 0
        ? [
            {
              group: $t('payment.merchant.store.workbench.groupCashier'),
              color: 'orange' as GroupColor,
              cards: cashierCards,
            },
          ]
        : []),
      ...(bindCards.length > 0
        ? [{ group: $t('payment.merchant.store.workbench.groupBind'), color: 'purple' as GroupColor, cards: bindCards }]
        : []),
      ...(defaultCards.length > 0
        ? [
            {
              group: $t('payment.merchant.store.workbench.groupDefault'),
              color: 'blue' as GroupColor,
              cards: defaultCards,
            },
          ]
        : []),
      ...(manageCards.length > 0
        ? [
            {
              group: $t('payment.merchant.store.workbench.groupManage'),
              color: 'gray' as GroupColor,
              cards: manageCards,
            },
          ]
        : []),
    ];
  });

  /**
   * 组标题竖条颜色
   */
  function getGroupColorClass(color: GroupColor) {
    const map: Record<GroupColor, string> = {
      blue: 'bg-blue-500',
      gray: 'bg-gray-500',
      orange: 'bg-orange-500',
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
      gray: 'bg-muted text-muted-foreground',
      orange: 'bg-orange-500/10 text-orange-500',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return map[color];
  }

  /** 数量标签文案(数字 + 单位, 如「1 台」) */
  function countText(card: WorkbenchCard) {
    return card.countUnit ? `${card.count} ${card.countUnit}` : String(card.count);
  }

  /**
   * 加载门店详情(标题与页签用)
   */
  async function loadStoreInfo() {
    const { data } = await MchStoreInfoApi.get(storeId.value);
    if (data) {
      storeInfo.value = data;
      // 页签标题动态化为「{门店名} · 门店工作台」
      setTabObjectTitle(data.storeName || '');
    }
  }

  /**
   * 加载门店概况聚合(码牌/系统终端计数徽标)
   */
  async function loadOverview() {
    const { data } = await MchStoreInfoApi.overview(storeId.value);
    overview.value = data || {};
  }

  /**
   * 加载本店收款设备绑定数(虚拟设备分页接口 total 静默取数, 失败不展示徽标)
   */
  async function loadDeviceCount() {
    try {
      const { data } = await VirtualDeviceApi.page({
        current: 1,
        size: 1,
        mchNo: mchNo.value,
        storeNo: storeNo.value,
      });
      deviceCount.value = Number(data?.total) || 0;
    } catch {
      deviceCount.value = undefined;
    }
  }

  /**
   * 编辑/绑定后全量刷新(详情 + 概况 + 设备计数)
   */
  function handleRefresh() {
    loadStoreInfo();
    loadOverview();
    loadDeviceCount();
  }

  /**
   * 打开「设置默认支付应用」弹窗(该商户启用应用)并回显本店当前应用
   */
  async function openAppModal() {
    selectedAppId.value = overview.value.storeAppId ?? undefined;
    appModalOpen.value = true;
    const { data } = await MchAppInfoApi.enableList(mchNo.value, true);
    appOptions.value = (data || [])
      .filter((item) => !!item.appId)
      .map((item) => ({
        label: item.appName || item.appId!,
        value: item.appId!,
      }));
  }

  /**
   * 弹窗内保存默认应用
   *
   * 清空(选「跟随商户默认」)且商户本身没有默认应用时二次确认, 避免按门店收款的入口失去可用应用。
   */
  async function handleSaveApp() {
    if (!selectedAppId.value && overview.value.storeAppId && !overview.value.mchDefaultAppId) {
      const ok = await new Promise<boolean>((resolve) => {
        confirm({
          content: $t('payment.merchant.store.workbench.confirmClearAppNoMchDefault'),
          okButtonProps: { danger: true },
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!ok) {
        return;
      }
    }
    appSaving.value = true;
    try {
      // 空串 = 清空, 跟随商户默认应用
      await MchStoreInfoApi.setApp(storeId.value, selectedAppId.value ?? '');
      message.success($t('common.operationSuccess'));
      appModalOpen.value = false;
      loadOverview();
    } finally {
      appSaving.value = false;
    }
  }

  /**
   * 设为默认门店(同商户唯一, 后端先清后设)
   */
  function handleSetDefaultStore() {
    confirm({
      content: $t('payment.merchant.store.store.confirmSetDefault'),
      onOk() {
        return MchStoreInfoApi.setDefault(storeId.value).then(() => {
          message.success($t('payment.merchant.store.workbench.setDefaultOk'));
          loadStoreInfo();
        });
      },
    });
  }

  /**
   * 取消默认门店(未指定门店的收单将无法回落, 需二次确认)
   */
  function handleClearDefaultStore() {
    confirm({
      content: $t('payment.merchant.store.workbench.confirmClearDefaultStore'),
      okButtonProps: { danger: true },
      onOk() {
        return MchStoreInfoApi.clearDefault(storeId.value).then(() => {
          message.success($t('payment.merchant.store.workbench.clearDefaultOk'));
          loadStoreInfo();
        });
      },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loading.value = true;
    Promise.all([loadStoreInfo(), loadOverview()])
      .then(() => loadDeviceCount())
      .finally(() => {
        loading.value = false;
      });
  });

  /**
   * 返回门店列表(带 mchNo 回跳)
   */
  function handleBack() {
    router.push({
      path: '/payment/merchant/store',
      query: { mchNo: mchNo.value },
    });
  }

  /**
   * 卡片点击分发: 对象卡跳对应列表页并预置商户+门店筛选, 快捷绑定卡开弹窗,
   * 默认应用/默认终端卡开设置弹窗, 门店信息卡开编辑抽屉, 删除卡经二次确认后删除门店
   */
  function handleCardClick(card: WorkbenchCard) {
    const routeMap: Record<string, string> = {
      device: '/device/virtual',
      qrcode: '/device/qrcode',
      terminal: '/payment/device/terminal/system',
    };
    const target = routeMap[card.key];
    if (target) {
      // 基础筛选参数(预置商户+门店过滤)
      const query: Record<string, string> = { mchNo: mchNo.value, storeNo: storeNo.value };
      // 终端列表页带回退按钮, 额外带 from=store + 门店 id 供原路返回门店工作台; 设备/码牌页无回退不携带
      if (card.key === 'terminal') {
        query.id = storeId.value;
        query.from = 'store';
      }
      router.push({ path: target, query });
      return;
    }
    switch (card.key) {
      case 'bindDevice':
      case 'bindQrcode':
      case 'bindTerminal': {
        // 快捷绑定弹窗(收款设备/码牌/系统终端)
        const bindMode = card.key === 'bindQrcode' ? 'qrcode' : card.key === 'bindTerminal' ? 'terminal' : 'device';
        bindModalRef.value?.show(bindMode, {
          mchNo: mchNo.value!,
          storeNo: storeNo.value!,
          storeName: storeInfo.value.storeName,
        });
        break;
      }
      case 'defaultApp': {
        openAppModal();
        break;
      }
      case 'defaultStore': {
        if (storeInfo.value.defaultStore) {
          handleClearDefaultStore();
        } else {
          handleSetDefaultStore();
        }
        break;
      }
      case 'defaultTerminal': {
        // 设置默认终端弹窗
        terminalDefaultRef.value?.show({
          mchNo: mchNo.value!,
          storeNo: storeNo.value!,
          storeName: storeInfo.value.storeName,
        });
        break;
      }
      case 'deleteStore': {
        handleDeleteStore();
        break;
      }
      case 'storeInfo': {
        // 打开编辑抽屉(复用门店卡片墙同款 MchStoreInfoEdit)
        storeEditRef.value?.showEdit(mchNo.value!, storeInfo.value);
        break;
      }
      // No default
    }
  }

  /**
   * 删除当前门店
   *
   * 默认门店禁止删除(与 MchStoreInfoService.delete 后端校验对齐),
   * 需先把其他门店设为默认, 再删除当前门店; 删除成功后回门店列表。
   */
  function handleDeleteStore() {
    if (storeInfo.value.defaultStore) {
      message.warning($t('payment.merchant.store.store.deleteDefaultBlocked'));
      return;
    }
    confirm({
      content: $t('payment.merchant.store.store.confirmDelete'),
      okButtonProps: { danger: true },
      onOk() {
        return MchStoreInfoApi.delete(storeId.value).then(() => {
          message.success($t('common.operationSuccess'));
          router.push({ path: '/payment/merchant/store', query: { mchNo: mchNo.value } });
        });
      },
    });
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingStoreContext')"
    :back-text="$t('payment.merchant.store.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3">
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="rounded-xl shadow-sm">
        <template #title>
          <!-- 标题栏: 返回 + 功能名 +（门店名） + 默认标签, 与工作台子页统一形态 -->
          <PageTitleBar
            back
            :title="$t('payment.merchant.store.workbench.title')"
            :name="storeInfo.storeName || ''"
            @back="handleBack"
          >
            <!-- 默认门店标签 -->
            <a-tag v-if="storeInfo.defaultStore" color="processing" class="!m-0 !text-xs">
              {{ $t('payment.merchant.store.store.defaultStore') }}
            </a-tag>
          </PageTitleBar>
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
                class="tile-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                :styles="{ body: { padding: '24px 20px' } }"
                @click="handleCardClick(card)"
              >
                <div class="flex flex-col items-center text-center">
                  <div
                    class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                    :class="
                      card.danger
                        ? 'bg-destructive/10 text-destructive'
                        : card.active
                          ? 'bg-primary/10 text-primary'
                          : getIconBgClass(group.color)
                    "
                  >
                    <IconifyIcon :icon="card.icon" class="h-7 w-7" />
                  </div>

                  <div
                    class="mb-1.5 flex items-center justify-center gap-1.5 text-base font-bold transition-colors duration-300"
                    :class="
                      card.danger
                        ? 'text-destructive'
                        : card.active
                          ? 'text-primary'
                          : 'text-foreground group-hover:text-primary'
                    "
                  >
                    <span class="truncate">{{ card.title }}</span>
                    <!-- 数量标签(标题右侧, 仅计数就绪时渲染; 存量语义用中性灰, 不用红点角标) -->
                    <span
                      v-if="card.count !== undefined"
                      class="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs leading-none font-medium text-muted-foreground"
                    >
                      {{ countText(card) }}
                    </span>
                  </div>
                  <a-tooltip :title="card.description" placement="bottom">
                    <div
                      class="card-desc line-clamp-1 text-xs leading-relaxed transition-colors duration-300"
                      :class="
                        card.danger
                          ? 'text-destructive/80 group-hover:text-destructive'
                          : card.active
                            ? 'text-primary/80 group-hover:text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                      "
                    >
                      {{ card.description }}
                    </div>
                  </a-tooltip>
                </div>

                <div
                  class="absolute bottom-0 left-0 h-1.5 transition-all duration-300"
                  :class="
                    card.danger
                      ? 'w-0 bg-destructive group-hover:w-full'
                      : card.active
                        ? 'w-full bg-primary'
                        : ['w-0 group-hover:w-full', getGroupColorClass(group.color)]
                  "
                />
              </a-card>
            </div>
          </div>

          <div v-if="functionCards.length === 0" class="py-16 text-center text-sm text-muted-foreground">
            {{ $t('payment.merchant.store.workbench.noActions') }}
          </div>
        </div>
      </a-card>
    </a-spin>

    <!-- 设置默认支付应用 -->
    <a-modal
      v-model:open="appModalOpen"
      :title="$t('payment.merchant.store.workbench.setAppTitle')"
      :confirm-loading="appSaving"
      @ok="handleSaveApp"
    >
      <a-select
        v-model:value="selectedAppId"
        :options="appOptions"
        allow-clear
        style="width: 100%"
        :placeholder="$t('payment.merchant.store.store.defaultAppPlaceholder')"
      />
      <div class="mt-2 text-xs text-muted-foreground">
        {{ $t('payment.merchant.store.store.defaultAppTip') }}
      </div>
    </a-modal>

    <MchStoreInfoEdit ref="storeEditRef" @ok="handleRefresh" />
    <StoreBindModal ref="bindModalRef" @ok="handleRefresh" />
    <StoreTerminalDefaultModal ref="terminalDefaultRef" @ok="handleRefresh" />
  </div>
</template>

<style scoped>
  .tile-card {
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

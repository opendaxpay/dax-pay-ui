<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useIsMobile } from '@vben/hooks';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { PayRouteApi, type PayRouteStrategyResult } from '#/api/payment/route/pay-route.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import PayRouteBasicPanel from './basic/PayRouteBasicPanel.vue';
  import PayRouteModeToolbar from './components/PayRouteModeToolbar.vue';
  import PayRouteScenePanel from './scene/PayRouteScenePanel.vue';
  import { PAY_ROUTE_MODE, type PayRouteMode } from './shared/payRoute.constants';
  import { modeDisplayName, normalizePayRouteMode } from './shared/payRoute.labels';

  defineOptions({ name: 'PayRouteConfig' });

  // 从应用管理带入 mchNo、appId；editMode 为配置编辑模式，effectiveMode 来自 strategy.mode
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
      const app = normalizeRouteQueryValue(route.query.appId);
      if (no && app) {
        return { path: '/payment/merchant/app/manage', query: { mchNo: no, appId: app } };
      }
      return no ? { path: '/payment/merchant/app', query: { mchNo: no } } : '/payment/merchant';
    }),
  });

  const mchNo = computed(() => routeContext.query.value.mchNo);
  const appId = computed(() => routeContext.query.value.appId);
  const appInfo = ref<MchAppInfoResult>({});
  const strategy = ref<PayRouteStrategyResult>({});
  const loading = ref(false);
  const editMode = ref<PayRouteMode>(PAY_ROUTE_MODE.BASIC);

  // 移动端(<768px)标识：编辑/保存/取消在移动端切换为底部固定操作栏
  const { isMobile } = useIsMobile();

  const basicPanelRef = ref<InstanceType<typeof PayRouteBasicPanel> | null>(null);
  const scenePanelRef = ref<InstanceType<typeof PayRouteScenePanel> | null>(null);

  // 编辑态由父组件统一持有，编辑/保存/取消按钮：桌面在卡片右上角，移动端为底部固定操作栏
  const editing = ref(false);
  // 按 editMode 路由到当前可见 panel 的方法（两 panel 均已 expose startEdit/save/cancel）
  const activePanel = computed(() =>
    editMode.value === PAY_ROUTE_MODE.BASIC ? basicPanelRef.value : scenePanelRef.value,
  );

  function onStartEdit() {
    activePanel.value?.startEdit();
  }

  function onSave() {
    activePanel.value?.save();
  }

  function onCancel() {
    activePanel.value?.cancel();
  }

  // 策略库中当前生效的路由模式
  const effectiveMode = computed<PayRouteMode>(() => normalizePayRouteMode(strategy.value.mode));
  // 编辑模式是否与生效模式一致
  const isEditModeActive = computed(() => editMode.value === effectiveMode.value);

  async function loadAppInfo() {
    if (!mchNo.value || !appId.value) {
      return;
    }
    const { data } = await MchAppInfoApi.page({ mchNo: mchNo.value, current: 1, size: 200 });
    const app = data?.records?.find((a) => a.appId === appId.value);
    appInfo.value = app || {};
  }

  async function loadStrategy() {
    if (!appId.value) {
      return;
    }
    loading.value = true;
    const { data: st } = await PayRouteApi.getOrInitStrategy(appId.value);
    strategy.value = st || {};
    await basicPanelRef.value?.reload();
    // 仅生效模式为场景时预加载批量候选，避免基础模式白打 batch
    if (normalizePayRouteMode(strategy.value.mode) === PAY_ROUTE_MODE.SCENE) {
      await scenePanelRef.value?.reload();
    }
    loading.value = false;
  }

  function handleBack() {
    router.push({
      path: '/payment/merchant/app/manage',
      query: { mchNo: mchNo.value, appId: appId.value },
    });
  }

  watch(editMode, (mode, prev) => {
    basicPanelRef.value?.resetEditing();
    scenePanelRef.value?.resetEditing();
    // 切换到场景编辑时加载配置（含批量候选）
    if (mode === PAY_ROUTE_MODE.SCENE && prev !== PAY_ROUTE_MODE.SCENE) {
      scenePanelRef.value?.reload();
    }
  });

  /**
   * 设为生效模式（始终确认，仅此处更新 strategy.mode）
   */
  function applyActiveMode() {
    if (!hasPermission(PermCodes.Merchant.AppRoute.MANAGE) || !appId.value) {
      return;
    }
    const targetModeName = modeDisplayName(editMode.value);
    confirm({
      content: $t('payment.merchant.route.route.setActiveModeConfirm', { mode: targetModeName }),
      onOk() {
        return PayRouteApi.updateStrategy({
          appId: appId.value,
          mode: editMode.value,
        }).then(async () => {
          message.success($t('common.operationSuccess'));
          await loadStrategy();
          editMode.value = effectiveMode.value;
        });
      },
    });
  }

  onMounted(async () => {
    if (!routeContext.isValid.value) {
      return;
    }
    await loadAppInfo();
    await nextTick();
    await loadStrategy();
    editMode.value = effectiveMode.value;
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="
      $t(
        !routeContext.query.value.mchNo
          ? 'payment.common.route.missingMchNo'
          : 'payment.common.route.missingAppContext',
      )
    "
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <a-button type="text" @click="handleBack">
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" />
            </template>
          </a-button>
          <span class="text-lg font-bold">{{ $t('payment.merchant.route.route.title') }}</span>
          <!-- 应用名：窄屏换行完整展示 -->
          <span v-if="appInfo.appName" class="min-w-0 break-all text-sm text-muted-foreground"
            >({{ appInfo.appName }})</span
          >
        </div>
      </template>

      <!-- 编辑操作：桌面在卡片右上角；移动端编辑态由底部固定操作栏承接 -->
      <template #extra>
        <div v-if="hasPermission(PermCodes.Merchant.AppRoute.MANAGE)" class="flex gap-2">
          <a-button v-if="!editing" type="primary" @click="onStartEdit">
            {{ $t('common.edit') }}
          </a-button>
          <template v-else-if="!isMobile">
            <a-button type="primary" @click="onSave">
              {{ $t('common.save') }}
            </a-button>
            <a-button @click="onCancel">{{ $t('common.cancel') }}</a-button>
          </template>
        </div>
      </template>

      <a-spin :spinning="loading">
        <PayRouteModeToolbar
          v-model:edit-mode="editMode"
          :effective-mode="effectiveMode"
          :is-edit-mode-active="isEditModeActive"
          @apply-active-mode="applyActiveMode"
        />

        <PayRouteBasicPanel
          v-show="editMode === PAY_ROUTE_MODE.BASIC"
          ref="basicPanelRef"
          v-model:editing="editing"
          :app-id="appId"
        />
        <PayRouteScenePanel
          v-show="editMode === PAY_ROUTE_MODE.SCENE"
          ref="scenePanelRef"
          v-model:editing="editing"
          :app-id="appId"
        />
      </a-spin>
    </a-card>

    <!-- 移动端编辑态底部占位，防止内容被固定操作栏遮挡 -->
    <div v-if="isMobile && editing" class="h-20"></div>

    <!-- 移动端编辑态固定底部操作栏（拇指可达区） -->
    <div
      v-if="isMobile && editing"
      class="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div class="flex gap-3">
        <a-button class="min-w-0 flex-1" @click="onCancel">{{ $t('common.cancel') }}</a-button>
        <a-button class="min-w-0 flex-1" type="primary" @click="onSave">
          {{ $t('common.save') }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { PayRouteMode } from './shared/payRoute.constants';

  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

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
      return no ? `/payment/merchant/app?mchNo=${no}` : '/payment/merchant';
    }),
  });

  const mchNo = computed(() => routeContext.query.value.mchNo);
  const appId = computed(() => routeContext.query.value.appId);
  const appInfo = ref<MchAppInfoResult>({});
  const strategy = ref<PayRouteStrategyResult>({});
  const loading = ref(false);
  const activeTab = ref('config');
  const editMode = ref<PayRouteMode>('basic');

  const basicPanelRef = ref<InstanceType<typeof PayRouteBasicPanel> | null>(null);
  const scenePanelRef = ref<InstanceType<typeof PayRouteScenePanel> | null>(null);

  // 编辑态由父组件统一持有，编辑/保存/取消按钮置于 a-tabs 标签行右侧
  const editing = ref(false);
  // 按 editMode 路由到当前可见 panel 的方法（两 panel 均已 expose startEdit/save/cancel）
  const activePanel = computed(() => (editMode.value === 'basic' ? basicPanelRef.value : scenePanelRef.value));

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
    if (strategy.value.mode === 'simple') {
      strategy.value.mode = 'scene';
    }
    await basicPanelRef.value?.reload();
    // 仅生效模式为场景时预加载批量候选，避免基础模式白打 batch
    if (normalizePayRouteMode(strategy.value.mode) === 'scene') {
      await scenePanelRef.value?.reload();
    }
    loading.value = false;
  }

  function handleBack() {
    router.push({ path: '/payment/merchant/app', query: { mchNo: mchNo.value } });
  }

  watch(editMode, (mode, prev) => {
    basicPanelRef.value?.resetEditing();
    scenePanelRef.value?.resetEditing();
    // 切换到场景编辑时加载配置（含批量候选）
    if (mode === 'scene' && prev !== 'scene') {
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
      $t(!routeContext.query.mchNo ? 'payment.common.route.missingMchNo' : 'payment.common.route.missingAppContext')
    "
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button type="text" @click="handleBack">
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" />
            </template>
          </a-button>
          <span class="text-lg font-bold">{{ $t('payment.merchant.route.route.title') }}</span>
          <span v-if="appInfo.appName" class="text-sm text-muted-foreground">({{ appInfo.appName }})</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <PayRouteModeToolbar
          v-model:edit-mode="editMode"
          :effective-mode="effectiveMode"
          :is-edit-mode-active="isEditModeActive"
          @apply-active-mode="applyActiveMode"
        />

        <a-tabs v-model:active-key="activeTab">
          <template #rightExtra>
            <div v-if="hasPermission(PermCodes.Merchant.AppRoute.MANAGE)" class="flex gap-2">
              <a-button v-if="!editing" type="primary" @click="onStartEdit">
                {{ $t('common.edit') }}
              </a-button>
              <template v-else>
                <a-button type="primary" @click="onSave">
                  {{ $t('common.save') }}
                </a-button>
                <a-button @click="onCancel">{{ $t('common.cancel') }}</a-button>
              </template>
            </div>
          </template>
          <a-tab-pane key="config" :tab="$t('payment.merchant.route.route.configTab')" force-render>
            <PayRouteBasicPanel
              v-show="editMode === 'basic'"
              ref="basicPanelRef"
              v-model:editing="editing"
              :app-id="appId"
            />
            <PayRouteScenePanel
              v-show="editMode === 'scene'"
              ref="scenePanelRef"
              v-model:editing="editing"
              :app-id="appId"
            />
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { PAY_ROUTE_MODE, type PayRouteMode } from './shared/payRoute.constants';

  import { computed, nextTick, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import MchAppSelectorBar from '#/components/app/MchAppSelectorBar.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { useMchAppSelector } from '#/hooks/useMchAppSelector';
  import { usePermission } from '#/hooks/usePermission';
  import { PayRouteApi, type PayRouteStrategyResult } from '#/api/payment/route/pay-route.api';

  import PayRouteBasicPanel from './basic/PayRouteBasicPanel.vue';
  import PayRouteModeToolbar from './components/PayRouteModeToolbar.vue';
  import PayRouteScenePanel from './scene/PayRouteScenePanel.vue';
  import { modeDisplayName, normalizePayRouteMode } from './shared/payRoute.labels';

  defineOptions({ name: 'PayRouteConfig' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 顶部 appId 选择器（无 mchNo URL）
  const {
    loading: appsLoading,
    appId,
    appName,
    hasApps,
    appOptions,
    loadApps,
    setAppId,
  } = useMchAppSelector();

  const strategy = ref<PayRouteStrategyResult>({});
  const loading = ref(false);
  const activeTab = ref('config');
  const editMode = ref<PayRouteMode>(PAY_ROUTE_MODE.BASIC);

  const basicPanelRef = ref<InstanceType<typeof PayRouteBasicPanel> | null>(null);
  const scenePanelRef = ref<InstanceType<typeof PayRouteScenePanel> | null>(null);

  // 编辑态由父组件统一持有
  const editing = ref(false);
  const activePanel = computed(() => (editMode.value === PAY_ROUTE_MODE.BASIC ? basicPanelRef.value : scenePanelRef.value));

  function onStartEdit() {
    activePanel.value?.startEdit();
  }

  function onSave() {
    activePanel.value?.save();
  }

  function onCancel() {
    activePanel.value?.cancel();
  }

  const effectiveMode = computed<PayRouteMode>(() => normalizePayRouteMode(strategy.value.mode));
  const isEditModeActive = computed(() => editMode.value === effectiveMode.value);

  async function loadStrategy() {
    if (!appId.value) {
      strategy.value = {};
      return;
    }
    loading.value = true;
    try {
      const { data: st } = await PayRouteApi.getOrInitStrategy(appId.value);
      strategy.value = st || {};
      await nextTick();
      await basicPanelRef.value?.reload();
      if (normalizePayRouteMode(strategy.value.mode) === PAY_ROUTE_MODE.SCENE) {
        await scenePanelRef.value?.reload();
      }
      editMode.value = effectiveMode.value;
    } finally {
      loading.value = false;
    }
  }

  watch(editMode, (mode, prev) => {
    basicPanelRef.value?.resetEditing();
    scenePanelRef.value?.resetEditing();
    if (mode === PAY_ROUTE_MODE.SCENE && prev !== PAY_ROUTE_MODE.SCENE) {
      scenePanelRef.value?.reload();
    }
  });

  // 切换应用时重载策略
  watch(appId, () => {
    editing.value = false;
    loadStrategy();
  });

  /**
   * 设为生效模式
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
    await loadApps();
    await loadStrategy();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <!-- 国际化：通道路由（与菜单一致） -->
          <span class="text-lg font-bold">{{ $t('menu.payment.merchant.payRoute') }}</span>
          <span v-if="appName" class="text-sm text-muted-foreground">({{ appName }})</span>
        </div>
      </template>

      <!-- 应用选择器 -->
      <MchAppSelectorBar
        :value="appId"
        :options="appOptions"
        :loading="appsLoading"
        @update:value="setAppId"
      />

      <a-empty v-if="!appsLoading && !hasApps" :description="$t('payment.merchant.app.app.emptyApps')" />

      <a-spin v-else :spinning="loading || appsLoading">
        <template v-if="appId">
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
            </a-tab-pane>
          </a-tabs>
        </template>
        <a-empty v-else :description="$t('payment.merchant.app.app.noAppSelected')" />
      </a-spin>
    </a-card>
  </div>
</template>

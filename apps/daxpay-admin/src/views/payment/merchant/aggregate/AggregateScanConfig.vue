<script lang="ts" setup>
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type AggregateClientEnvParam,
    AggregateConfigApi,
    type AggregateConfigResult,
  } from '#/api/payment/merchant/aggregate.api';
  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { PayRouteApi } from '#/api/payment/route/pay-route.api';
  import ChannelMerchantSelect from '#/components/channel/ChannelMerchantSelect.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import { PAY_ROUTE_MODE } from '#/views/payment/route/shared/payRoute.constants';
  import { modeDisplayName } from '#/views/payment/route/shared/payRoute.labels';
  import RouteHitPreviewBlock from '#/views/payment/merchant/shared/RouteHitPreviewBlock.vue';
  import { useRouteHitPreview } from '#/views/payment/merchant/shared/useRouteHitPreview';

  import { AGGREGATE_CLIENT_ENVS, AGGREGATE_LEVEL, type AggregateLevel } from './shared/constants';

  defineOptions({ name: 'AggregateScanConfig' });

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();

  // 路由参数校验: mchNo + appId 必传
  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo', 'appId'],
    messageKey: computed(() =>
      normalizeRouteQueryValue(route.query.mchNo)
        ? 'payment.merchant.aggregate.aggregate.missingAppContext'
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

  // 页面状态
  const loading = ref(false);
  const editing = ref(false);
  const appInfo = ref<MchAppInfoResult>({});
  const config = ref<AggregateConfigResult>({});

  // 编辑态
  const editLevel = ref<AggregateLevel>(AGGREGATE_LEVEL.AUTO);
  const autoLaunch = ref(false);
  // 每客户端环境的编辑数据: clientEnv → { method, channelMchNo, capability }
  const clientEnvForm = ref<Record<string, AggregateClientEnvParam>>({});

  // 候选数据
  const methodDirectory = ref<Record<string, LabelValue[]>>({}); // provider → 方式列表
  const channelMchMap = ref<Record<string, ChannelMchOption[]>>({}); // clientEnv → 通道商户列表
  const capabilityMap = ref<Record<string, LabelValue[]>>({}); // clientEnv → 能力列表

  // 通道路由命中预览（与路由页同源；解构以便模板自动解包 ref）
  const {
    loading: routeHitLoading,
    effectiveMode: routeEffectiveMode,
    methodLabel: routeMethodLabel,
    load: loadRouteHit,
    preview: previewRouteHit,
  } = useRouteHitPreview();

  // 生效模式(服务端)
  const effectiveLevel = computed(() => config.value.level || AGGREGATE_LEVEL.AUTO);
  const isLevelActive = computed(() => editLevel.value === effectiveLevel.value);

  // AUTO / METHOD 需展示路由预览
  const showRoutePreview = computed(
    () => editLevel.value === AGGREGATE_LEVEL.AUTO || editLevel.value === AGGREGATE_LEVEL.METHOD,
  );

  // 模式提示
  const modeHint = computed(() => {
    const key = editLevel.value;
    if (key === AGGREGATE_LEVEL.AUTO) {
      return $t('payment.merchant.aggregate.aggregate.autoModeHint');
    }
    if (key === AGGREGATE_LEVEL.METHOD) {
      return $t('payment.merchant.aggregate.aggregate.methodModeHint');
    }
    return $t('payment.merchant.aggregate.aggregate.directModeHint');
  });

  // 当前通道路由模式文案
  const routeModeLabel = computed(() => {
    const mode = routeEffectiveMode.value;
    if (!mode) {
      return '—';
    }
    return modeDisplayName(mode === PAY_ROUTE_MODE.BASIC ? PAY_ROUTE_MODE.BASIC : PAY_ROUTE_MODE.SCENE);
  });

  /** 场景国际化名 */
  function clientEnvLabel(clientEnv: string) {
    return $t(`payment.merchant.aggregate.aggregate.clientEnvs.${clientEnv}`);
  }

  /** 初始化每场景编辑数据 */
  function initSceneForm() {
    const form: Record<string, AggregateClientEnvParam> = {};
    for (const sc of AGGREGATE_CLIENT_ENVS) {
      const serverEnv = config.value.clientEnvs?.find((s) => s.clientEnv === sc.clientEnv);
      form[sc.clientEnv] = {
        clientEnv: sc.clientEnv,
        method: serverEnv?.method || '',
        channelMchNo: serverEnv?.channelMchNo || '',
        capability: serverEnv?.capability || '',
      };
    }
    clientEnvForm.value = form;
  }

  /** 获取某场景编辑数据 */
  function getClientEnvData(clientEnv: string) {
    if (!clientEnvForm.value[clientEnv]) {
      clientEnvForm.value[clientEnv] = { clientEnv, method: '', channelMchNo: '', capability: '' };
    }
    return clientEnvForm.value[clientEnv]!;
  }

  /** METHOD 模式: 某渠道下可选支付方式 */
  function methodOptions(provider: string) {
    return methodDirectory.value[provider] || [];
  }

  /** DIRECT 模式: 某场景可选通道商户 */
  function channelMchOptions(clientEnv: string) {
    return channelMchMap.value[clientEnv] || [];
  }

  /** DIRECT 模式: 某场景可选能力 */
  function capabilityOptions(clientEnv: string) {
    return capabilityMap.value[clientEnv] || [];
  }

  /** 加载支付方式目录(METHOD 模式用) */
  async function loadMethodDirectory() {
    const { data } = await PayRouteApi.listMethodDirectoryFlat();
    const map: Record<string, LabelValue[]> = {};
    for (const item of data || []) {
      if (!map[item.provider]) {
        map[item.provider] = [];
      }
      map[item.provider]!.push({ label: item.methodLabel || item.method, value: item.method });
    }
    methodDirectory.value = map;
  }

  /** 查找支付方式的友好名称 */
  function findMethodLabel(provider: string, method: string): string {
    const fromRoute = routeMethodLabel(method);
    if (fromRoute && fromRoute !== method) {
      return fromRoute;
    }
    const list = methodDirectory.value[provider];
    return list?.find((m) => m.value === method)?.label || method;
  }

  /** 当前行用于路由预览的 method（AUTO 默认 / METHOD 手选） */
  function resolveMethodForEnv(sc: (typeof AGGREGATE_CLIENT_ENVS)[number]): string {
    if (editLevel.value === AGGREGATE_LEVEL.AUTO) {
      return sc.defaultMethod;
    }
    if (editLevel.value === AGGREGATE_LEVEL.METHOD) {
      return getClientEnvData(sc.clientEnv).method || '';
    }
    return '';
  }

  /** 加载通道商户候选(DIRECT 模式用) */
  async function loadChannelMchCandidates() {
    const map: Record<string, ChannelMchOption[]> = {};
    await Promise.all(
      AGGREGATE_CLIENT_ENVS.map(async (sc) => {
        const { data } = await PayRouteApi.listSceneChannelMchCandidates({
          appId: appId.value,
          provider: sc.provider,
          method: sc.defaultMethod,
        });
        map[sc.clientEnv] = data || [];
      }),
    );
    channelMchMap.value = map;
  }

  /** 某场景选中通道商户后加载能力候选 */
  async function loadCapabilityForClientEnv(clientEnv: string, channelMchNo: string) {
    const sc = AGGREGATE_CLIENT_ENVS.find((s) => s.clientEnv === clientEnv);
    if (!sc || !channelMchNo) {
      capabilityMap.value = { ...capabilityMap.value, [clientEnv]: [] };
      return;
    }
    const { data } = await PayRouteApi.listSceneCapabilityCandidates({
      appId: appId.value,
      provider: sc.provider,
      method: sc.defaultMethod,
      channelMchNo,
    });
    capabilityMap.value = { ...capabilityMap.value, [clientEnv]: data || [] };
  }

  /** 加载应用信息 */
  async function loadAppInfo() {
    if (!mchNo.value || !appId.value) return;
    const { data } = await MchAppInfoApi.page({ mchNo: mchNo.value, current: 1, size: 200 });
    const app = data?.records?.find((a) => a.appId === appId.value);
    appInfo.value = app || {};
  }

  /** 加载配置 + 通道路由预览 */
  async function loadConfig() {
    if (!appId.value) return;
    loading.value = true;
    const { data } = await AggregateConfigApi.getByAppId(appId.value);
    config.value = data || {};
    editLevel.value = (effectiveLevel.value as AggregateLevel) || AGGREGATE_LEVEL.AUTO;
    autoLaunch.value = config.value.autoLaunch || false;
    initSceneForm();
    await Promise.all([loadMethodDirectory(), loadRouteHit(appId.value)]);
    loading.value = false;
  }

  /** 返回应用列表 */
  function handleBack() {
    router.push({
      path: '/payment/merchant/app/manage',
      query: { mchNo: mchNo.value, appId: appId.value },
    });
  }

  /** 跳转通道路由配置 */
  function goPayRoute() {
    router.push({
      path: '/payment/route',
      query: { mchNo: mchNo.value, appId: appId.value },
    });
  }

  /** 进入编辑 */
  async function startEdit() {
    editing.value = true;
    initSceneForm();
    // 按模式加载候选
    if (editLevel.value === AGGREGATE_LEVEL.METHOD) {
      await loadMethodDirectory();
    } else if (editLevel.value === AGGREGATE_LEVEL.DIRECT) {
      await loadChannelMchCandidates();
      // 对已选通道商户的场景加载能力候选
      for (const sc of AGGREGATE_CLIENT_ENVS) {
        const sd = getClientEnvData(sc.clientEnv);
        if (sd.channelMchNo) {
          await loadCapabilityForClientEnv(sc.clientEnv, sd.channelMchNo);
        }
      }
    }
  }

  /**
   * 收集 METHOD/DIRECT 已填写行(配多少存多少)
   * DIRECT 只填商户或只填能力视为不完整, 提示补全
   */
  function collectFilledClientEnvs(): AggregateClientEnvParam[] | null {
    if (editLevel.value === AGGREGATE_LEVEL.AUTO) {
      return [];
    }
    const filled: AggregateClientEnvParam[] = [];
    for (const sc of AGGREGATE_CLIENT_ENVS) {
      const sd = getClientEnvData(sc.clientEnv);
      if (editLevel.value === AGGREGATE_LEVEL.METHOD) {
        if (sd.method) {
          filled.push({ ...sd });
        }
        continue;
      }
      // DIRECT
      const hasMch = !!sd.channelMchNo;
      const hasCap = !!sd.capability;
      if (!hasMch && !hasCap) {
        continue;
      }
      if (!hasMch || !hasCap) {
        message.error(
          $t('payment.merchant.aggregate.aggregate.partialRowIncomplete') + ': ' + clientEnvLabel(sc.clientEnv),
        );
        return null;
      }
      filled.push({ ...sd });
    }
    if (filled.length === 0) {
      message.error($t('payment.merchant.aggregate.aggregate.atLeastOneRequired'));
      return null;
    }
    return filled;
  }

  /** 保存 */
  function save() {
    const clientEnvs = collectFilledClientEnvs();
    if (clientEnvs === null) {
      return;
    }

    confirm({
      content: $t('payment.merchant.aggregate.aggregate.saveConfirm'),
      async onOk() {
        await AggregateConfigApi.saveOrUpdate({
          mchNo: mchNo.value,
          appId: appId.value,
          level: editLevel.value,
          autoLaunch: autoLaunch.value,
          clientEnvs,
        });
        message.success($t('common.operationSuccess'));
        editing.value = false;
        await loadConfig();
      },
    });
  }

  /** 取消编辑 */
  function cancel() {
    editing.value = false;
    initSceneForm();
    autoLaunch.value = config.value.autoLaunch || false;
    editLevel.value = effectiveLevel.value as AggregateLevel;
  }

  // 编辑模式下切换模式时加载候选
  watch(editLevel, async (level, prev) => {
    if (!editing.value || level === prev) return;
    if (level === AGGREGATE_LEVEL.METHOD) {
      await loadMethodDirectory();
    } else if (level === AGGREGATE_LEVEL.DIRECT) {
      await loadChannelMchCandidates();
    }
  });

  /** DIRECT 模式: 通道商户变更时加载能力候选并清空旧值 */
  async function onChannelMchChange(clientEnv: string, channelMchNo: any) {
    const sd = getClientEnvData(clientEnv);
    sd.channelMchNo = channelMchNo || '';
    sd.capability = '';
    if (channelMchNo) {
      await loadCapabilityForClientEnv(clientEnv, channelMchNo);
    } else {
      capabilityMap.value = { ...capabilityMap.value, [clientEnv]: [] };
    }
  }

  onMounted(async () => {
    if (!routeContext.isValid.value) return;
    await loadAppInfo();
    await loadConfig();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.merchant.aggregate.aggregate.missingAppContext')"
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
          <span class="text-lg font-bold">{{ $t('payment.merchant.aggregate.aggregate.title') }}</span>
          <span v-if="appInfo.appName" class="text-sm text-muted-foreground"> ({{ appInfo.appName }}) </span>
        </div>
      </template>

      <template #extra>
        <div class="flex gap-2">
          <a-button v-if="!editing" type="primary" @click="startEdit">
            {{ $t('common.edit') }}
          </a-button>
          <template v-else>
            <a-button type="primary" @click="save">{{ $t('common.save') }}</a-button>
            <a-button @click="cancel">{{ $t('common.cancel') }}</a-button>
          </template>
        </div>
      </template>

      <a-spin :spinning="loading || routeHitLoading">
        <!-- 公共参数: 自动拉起 -->
        <div class="mb-2">
          <a-checkbox v-model:checked="autoLaunch" :disabled="!editing">
            {{ $t('payment.merchant.aggregate.aggregate.autoLaunch') }}
          </a-checkbox>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ $t('payment.merchant.aggregate.aggregate.autoLaunchHint') }}
          </span>
        </div>

        <a-divider class="!my-4" />

        <!-- 配置模式 -->
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium">{{ $t('payment.merchant.aggregate.aggregate.editModeLabel') }}</span>
          <a-radio-group v-model:value="editLevel" button-style="solid" :disabled="!editing">
            <a-radio-button :value="AGGREGATE_LEVEL.AUTO">
              {{ $t('payment.merchant.aggregate.aggregate.modeAuto') }}
            </a-radio-button>
            <a-radio-button :value="AGGREGATE_LEVEL.METHOD">
              {{ $t('payment.merchant.aggregate.aggregate.modeMethod') }}
            </a-radio-button>
            <a-radio-button :value="AGGREGATE_LEVEL.DIRECT">
              {{ $t('payment.merchant.aggregate.aggregate.modeDirect') }}
            </a-radio-button>
          </a-radio-group>
          <a-tag v-if="isLevelActive && !editing" color="green">
            {{ $t('payment.merchant.aggregate.aggregate.levelActive') }}
          </a-tag>
        </div>

        <!-- 模式提示 -->
        <div class="mb-4">
          <a-alert :message="modeHint" type="info" show-icon />
        </div>

        <!-- 当前通道路由 + 跳转（AUTO/METHOD） -->
        <div v-if="showRoutePreview" class="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted-foreground">{{ $t('payment.merchant.aggregate.aggregate.currentRouteMode') }}:</span>
          <a-tag color="blue">{{ routeModeLabel }}</a-tag>
          <a-button type="link" size="small" class="!px-1" @click="goPayRoute">
            {{ $t('payment.merchant.aggregate.aggregate.goPayRoute') }}
            <IconifyIcon icon="ant-design:right-outlined" class="inline" />
          </a-button>
        </div>

        <!-- 场景配置：表头一次 + 每环境单行横排 -->
        <div class="env-table-wrap">
          <div class="env-table" :class="showRoutePreview ? 'cols-route' : 'cols-direct'">
            <!-- 表头 -->
            <div class="env-grid-header">
              <div>{{ $t('payment.merchant.aggregate.aggregate.scene') }}</div>
              <div v-if="showRoutePreview">{{ $t('payment.merchant.aggregate.aggregate.method') }}</div>
              <div>{{ $t('payment.merchant.route.route.channelMerchant') }}</div>
              <div>{{ $t('payment.merchant.route.route.payCapability') }}</div>
            </div>

            <!-- 数据行 -->
            <div v-for="sc in AGGREGATE_CLIENT_ENVS" :key="sc.clientEnv" class="env-grid-row">
              <div class="cell-env font-medium">{{ clientEnvLabel(sc.clientEnv) }}</div>

              <!-- AUTO：只读支付方式 + 路由预览 -->
              <template v-if="editLevel === AGGREGATE_LEVEL.AUTO">
                <div class="cell-text" :title="findMethodLabel(sc.provider, sc.defaultMethod)">
                  {{ findMethodLabel(sc.provider, sc.defaultMethod) }}
                </div>
                <RouteHitPreviewBlock
                  :hit="previewRouteHit(sc.provider, sc.defaultMethod)"
                  i18n-prefix="payment.merchant.aggregate.aggregate"
                />
              </template>

              <!-- METHOD：选支付方式 + 路由预览 -->
              <template v-else-if="editLevel === AGGREGATE_LEVEL.METHOD">
                <div>
                  <a-select
                    :value="getClientEnvData(sc.clientEnv).method"
                    :options="methodOptions(sc.provider)"
                    :placeholder="$t('payment.merchant.aggregate.aggregate.methodPlaceholder')"
                    :disabled="!editing"
                    allow-clear
                    class="w-full min-w-[160px]"
                    @change="(val: any) => (getClientEnvData(sc.clientEnv).method = val || '')"
                  />
                </div>
                <RouteHitPreviewBlock
                  :hit="previewRouteHit(sc.provider, resolveMethodForEnv(sc))"
                  i18n-prefix="payment.merchant.aggregate.aggregate"
                />
              </template>

              <!-- DIRECT：通道商户 + 能力（跳过路由） -->
              <template v-else>
                <div>
                  <ChannelMerchantSelect
                    :value="getClientEnvData(sc.clientEnv).channelMchNo"
                    :options="channelMchOptions(sc.clientEnv)"
                    :placeholder="$t('payment.merchant.aggregate.aggregate.channelMerchantPlaceholder')"
                    :disabled="!editing"
                    root-class-name="w-full min-w-[160px]"
                    @change="(val: any) => onChannelMchChange(sc.clientEnv, val)"
                  />
                </div>
                <div>
                  <a-select
                    :value="getClientEnvData(sc.clientEnv).capability"
                    :options="capabilityOptions(sc.clientEnv)"
                    :placeholder="$t('payment.merchant.aggregate.aggregate.capabilityPlaceholder')"
                    :disabled="!editing || !getClientEnvData(sc.clientEnv).channelMchNo"
                    allow-clear
                    class="w-full min-w-[160px]"
                    @change="(val: any) => (getClientEnvData(sc.clientEnv).capability = val)"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped>
  .env-table-wrap {
    overflow-x: auto;
    padding: 16px;
    background: hsl(var(--muted) / 0.3);
    border-radius: 12px;
  }

  .env-table {
    min-width: 640px;
  }

  /* AUTO/METHOD：环境 | 支付方式 | 通道商户 | 支付能力 */
  .env-table.cols-route .env-grid-header,
  .env-table.cols-route .env-grid-row {
    grid-template-columns: 110px minmax(160px, 1fr) minmax(160px, 1.2fr) minmax(140px, 1.1fr);
  }

  /* DIRECT：环境 | 通道商户 | 支付能力 */
  .env-table.cols-direct .env-grid-header,
  .env-table.cols-direct .env-grid-row {
    grid-template-columns: 110px minmax(180px, 1.2fr) minmax(180px, 1.2fr);
  }

  .env-grid-header,
  .env-grid-row {
    display: grid;
    align-items: center;
    gap: 12px 16px;
  }

  .env-grid-header {
    padding: 0 12px 10px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }

  .env-grid-row {
    padding: 10px 12px;
    margin-bottom: 8px;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 10px;
  }

  .env-grid-row:last-child {
    margin-bottom: 0;
  }

  .cell-env {
    font-size: 13px;
  }

  .cell-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
</style>

<script lang="ts" setup>
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onMounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type CodeClientEnvParam,
    CodeConfigApi,
    type CodeConfigResult,
  } from '#/api/payment/merchant/code-config.api';
  import { type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { PayRouteApi } from '#/api/payment/route/pay-route.api';
  import ChannelMerchantSelect from '#/components/channel/ChannelMerchantSelect.vue';
  import MchAppSelectorBar from '#/components/app/MchAppSelectorBar.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useMchAppSelector } from '#/hooks/useMchAppSelector';
  import { PAY_ROUTE_MODE } from '#/views/payment/route/shared/payRoute.constants';
  import { modeDisplayName } from '#/views/payment/route/shared/payRoute.labels';
  import RouteHitPreviewBlock from '#/views/payment/merchant/shared/RouteHitPreviewBlock.vue';
  import { useRouteHitPreview } from '#/views/payment/merchant/shared/useRouteHitPreview';

  import {
    CODE_CLIENT_ENVS,
    CODE_LEVEL,
    CODE_PAY_FORM,
    CODE_PAY_FORMS,
    type CodeLevel,
    type CodePayForm,
    defaultMethodFor,
    rowKey,
  } from './shared/constants';

  defineOptions({ name: 'CodePayConfig' });

  const router = useRouter();
  const { confirm, message } = useMessage();

  // 顶部 appId 选择器（无 mchNo URL）
  const {
    loading: appsLoading,
    appId,
    mchNo,
    appName,
    selectedApp,
    hasApps,
    appOptions,
    loadApps,
    setAppId,
  } = useMchAppSelector();


  const loading = ref(false);
  const editing = ref(false);
  const appInfo = ref<MchAppInfoResult>({});
  const config = ref<CodeConfigResult>({});

  const editLevel = ref<CodeLevel>(CODE_LEVEL.AUTO);
  // key = clientEnv|payForm
  const clientEnvForm = ref<Record<string, CodeClientEnvParam>>({});

  const methodDirectory = ref<Record<string, LabelValue[]>>({});
  const channelMchMap = ref<Record<string, ChannelMchOption[]>>({});
  const capabilityMap = ref<Record<string, LabelValue[]>>({});

  // 通道路由命中预览（与路由页同源；解构以便模板自动解包 ref）
  const {
    loading: routeHitLoading,
    effectiveMode: routeEffectiveMode,
    methodLabel: routeMethodLabel,
    load: loadRouteHit,
    preview: previewRouteHit,
  } = useRouteHitPreview();

  const effectiveLevel = computed(() => config.value.level || CODE_LEVEL.AUTO);
  const isLevelActive = computed(() => editLevel.value === effectiveLevel.value);

  const showRoutePreview = computed(() => editLevel.value === CODE_LEVEL.AUTO || editLevel.value === CODE_LEVEL.METHOD);

  const modeHint = computed(() => {
    if (editLevel.value === CODE_LEVEL.AUTO) {
      return $t('payment.merchant.codeConfig.codeConfig.autoModeHint');
    }
    if (editLevel.value === CODE_LEVEL.METHOD) {
      return $t('payment.merchant.codeConfig.codeConfig.methodModeHint');
    }
    return $t('payment.merchant.codeConfig.codeConfig.directModeHint');
  });

  const routeModeLabel = computed(() => {
    const mode = routeEffectiveMode.value;
    if (!mode) {
      return '—';
    }
    return modeDisplayName(mode === PAY_ROUTE_MODE.BASIC ? PAY_ROUTE_MODE.BASIC : PAY_ROUTE_MODE.SCENE);
  });

  /** 环境名 */
  function clientEnvLabel(clientEnv: string) {
    return $t(`payment.merchant.codeConfig.codeConfig.clientEnvs.${clientEnv}`);
  }

  /** 形态名 */
  function payFormLabel(payForm: string) {
    return $t(`payment.merchant.codeConfig.codeConfig.payForms.${payForm}`);
  }

  /** 初始化编辑表: 4 环境 × 2 形态 */
  function initSceneForm() {
    const form: Record<string, CodeClientEnvParam> = {};
    for (const sc of CODE_CLIENT_ENVS) {
      for (const pf of CODE_PAY_FORMS) {
        const key = rowKey(sc.clientEnv, pf);
        const serverEnv = config.value.clientEnvs?.find((s) => s.clientEnv === sc.clientEnv && s.payForm === pf);
        form[key] = {
          clientEnv: sc.clientEnv,
          payForm: pf,
          method: serverEnv?.method || '',
          channelMchNo: serverEnv?.channelMchNo || '',
          capability: serverEnv?.capability || '',
        };
      }
    }
    clientEnvForm.value = form;
  }

  function getRow(clientEnv: string, payForm: string) {
    const key = rowKey(clientEnv, payForm);
    if (!clientEnvForm.value[key]) {
      clientEnvForm.value[key] = {
        clientEnv,
        payForm,
        method: '',
        channelMchNo: '',
        capability: '',
      };
    }
    return clientEnvForm.value[key]!;
  }

  function methodOptions(provider: string) {
    return methodDirectory.value[provider] || [];
  }

  function channelMchOptions(clientEnv: string, payForm: string) {
    return channelMchMap.value[rowKey(clientEnv, payForm)] || [];
  }

  function capabilityOptions(clientEnv: string, payForm: string) {
    return capabilityMap.value[rowKey(clientEnv, payForm)] || [];
  }

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

  function findMethodLabel(provider: string, method: string): string {
    const fromRoute = routeMethodLabel(method);
    if (fromRoute && fromRoute !== method) {
      return fromRoute;
    }
    const list = methodDirectory.value[provider];
    return list?.find((m) => m.value === method)?.label || method;
  }

  /** 当前行用于路由预览的 method */
  function resolveMethodForRow(clientEnv: string, payForm: CodePayForm): string {
    if (editLevel.value === CODE_LEVEL.AUTO) {
      return defaultMethodFor(clientEnv, payForm);
    }
    if (editLevel.value === CODE_LEVEL.METHOD) {
      return getRow(clientEnv, payForm).method || '';
    }
    return '';
  }

  /**
   * 展示行：AUTO 且 H5/mini 默认 method 相同时合并为一行（支付宝/云闪付/抖音）
   * METHOD/DIRECT 始终拆两行（可分别配置）
   */
  type DisplayFormRow = {
    key: string;
    merged: boolean;
    payForms: CodePayForm[];
    /** 预览/展示用主形态（合并时取 H5） */
    primaryForm: CodePayForm;
  };

  function displayFormRows(clientEnv: string): DisplayFormRow[] {
    if (editLevel.value === CODE_LEVEL.AUTO) {
      const h5Method = defaultMethodFor(clientEnv, CODE_PAY_FORM.H5);
      const miniMethod = defaultMethodFor(clientEnv, CODE_PAY_FORM.MINI);
      if (h5Method && h5Method === miniMethod) {
        return [
          {
            key: `${clientEnv}|merged`,
            payForms: [CODE_PAY_FORM.H5, CODE_PAY_FORM.MINI],
            merged: true,
            primaryForm: CODE_PAY_FORM.H5,
          },
        ];
      }
    }
    return CODE_PAY_FORMS.map((pf) => ({
      key: rowKey(clientEnv, pf),
      payForms: [pf],
      merged: false,
      primaryForm: pf,
    }));
  }

  /** 未配置时：同环境另一形态已配置则强调告警，否则灰色降噪 */
  function emptyToneFor(provider: string, clientEnv: string, payForm: CodePayForm): 'emphasize' | 'soft' {
    const method = resolveMethodForRow(clientEnv, payForm);
    if (!method) {
      return 'soft';
    }
    const hit = previewRouteHit(provider, method);
    if (hit.status !== 'notConfigured') {
      return 'soft';
    }
    const sibling = payForm === CODE_PAY_FORM.H5 ? CODE_PAY_FORM.MINI : CODE_PAY_FORM.H5;
    // 合并展示时两形态 method 相同，无 sibling 差异
    if (defaultMethodFor(clientEnv, payForm) === defaultMethodFor(clientEnv, sibling)) {
      return 'soft';
    }
    const siblingMethod = resolveMethodForRow(clientEnv, sibling);
    if (!siblingMethod) {
      return 'soft';
    }
    const siblingHit = previewRouteHit(provider, siblingMethod);
    return siblingHit.status === 'ok' ? 'emphasize' : 'soft';
  }

  /** 路由覆盖摘要：已配置数 / 实际 method 去重后的槽位数 */
  const routeCoverage = computed(() => {
    if (!showRoutePreview.value) {
      return null;
    }
    let total = 0;
    let ok = 0;
    const gapLabels: string[] = [];
    const seenMethods = new Set<string>();
    for (const sc of CODE_CLIENT_ENVS) {
      for (const pf of CODE_PAY_FORMS) {
        const method = resolveMethodForRow(sc.clientEnv, pf);
        if (!method || seenMethods.has(`${sc.clientEnv}|${method}`)) {
          continue;
        }
        seenMethods.add(`${sc.clientEnv}|${method}`);
        total += 1;
        const hit = previewRouteHit(sc.provider, method);
        if (hit.status === 'ok') {
          ok += 1;
        } else if (
          (hit.status === 'notConfigured' || hit.status === 'noStrategy') && // 仅收集「同环境另一形态已配」的缺口，避免刷屏
          emptyToneFor(sc.provider, sc.clientEnv, pf) === 'emphasize'
        ) {
          gapLabels.push(`${clientEnvLabel(sc.clientEnv)} · ${payFormLabel(pf)}`);
        }
      }
    }
    return { total, ok, gapLabels };
  });

  /**
   * DIRECT: 按商户+渠道列通道商户（不绑默认 JSAPI method，与路由直接指定一致）
   */
  async function loadChannelMchCandidates() {
    const map: Record<string, ChannelMchOption[]> = {};
    await Promise.all(
      CODE_CLIENT_ENVS.map(async (sc) => {
        // mchNo 由后端 PaymentContext 强制，前端不再传
        const { data } = await CodeConfigApi.listDirectChannelMchCandidates({
          provider: sc.provider,
        });
        const list = data || [];
        // 同环境 H5/mini 共用同一批通道商户候选
        for (const pf of CODE_PAY_FORMS) {
          map[rowKey(sc.clientEnv, pf)] = list;
        }
      }),
    );
    channelMchMap.value = map;
  }

  /**
   * DIRECT: 按通道商户列全部已挂载能力（含 H5/主扫），供 needOpenId 与真实能力对齐
   */
  async function loadCapabilityForRow(clientEnv: string, payForm: CodePayForm, channelMchNo: string) {
    const key = rowKey(clientEnv, payForm);
    if (!channelMchNo) {
      capabilityMap.value = { ...capabilityMap.value, [key]: [] };
      return;
    }
    const { data } = await CodeConfigApi.listDirectCapabilityCandidates(channelMchNo);
    capabilityMap.value = { ...capabilityMap.value, [key]: data || [] };
  }

  async function loadAppInfo() {
    appInfo.value = selectedApp.value || {};
  }


  async function loadConfig() {
    if (!appId.value) return;
    loading.value = true;
    const { data } = await CodeConfigApi.getByAppId(appId.value);
    config.value = data || {};
    editLevel.value = (effectiveLevel.value as CodeLevel) || CODE_LEVEL.AUTO;
    initSceneForm();
    await Promise.all([loadMethodDirectory(), loadRouteHit(appId.value)]);
    loading.value = false;
  }

  /** 跳转通道路由配置 */
  function goPayRoute() {
    // 商户端仅带 appId，路由页自带应用选择器
    router.push({
      path: '/payment/route',
      query: { appId: appId.value },
    });
  }

  async function startEdit() {
    editing.value = true;
    initSceneForm();
    if (editLevel.value === CODE_LEVEL.METHOD) {
      await loadMethodDirectory();
    } else if (editLevel.value === CODE_LEVEL.DIRECT) {
      await loadChannelMchCandidates();
      for (const sc of CODE_CLIENT_ENVS) {
        for (const pf of CODE_PAY_FORMS) {
          const sd = getRow(sc.clientEnv, pf);
          if (sd.channelMchNo) {
            await loadCapabilityForRow(sc.clientEnv, pf, sd.channelMchNo);
          }
        }
      }
    }
  }

  /**
   * 收集 METHOD/DIRECT 已填写行(配多少存多少)
   * DIRECT 只填商户或只填能力视为不完整
   */
  function collectFilledClientEnvs(): CodeClientEnvParam[] | null {
    if (editLevel.value === CODE_LEVEL.AUTO) {
      return [];
    }
    const filled: CodeClientEnvParam[] = [];
    for (const sc of CODE_CLIENT_ENVS) {
      for (const pf of CODE_PAY_FORMS) {
        const sd = getRow(sc.clientEnv, pf);
        if (editLevel.value === CODE_LEVEL.METHOD) {
          if (sd.method) {
            filled.push({ ...sd });
          }
          continue;
        }
        const hasMch = !!sd.channelMchNo;
        const hasCap = !!sd.capability;
        if (!hasMch && !hasCap) {
          continue;
        }
        if (!hasMch || !hasCap) {
          message.error(
            $t('payment.merchant.codeConfig.codeConfig.partialRowIncomplete') +
              ': ' +
              clientEnvLabel(sc.clientEnv) +
              ' / ' +
              payFormLabel(pf),
          );
          return null;
        }
        filled.push({ ...sd });
      }
    }
    if (filled.length === 0) {
      message.error($t('payment.merchant.codeConfig.codeConfig.atLeastOneRequired'));
      return null;
    }
    return filled;
  }

  function save() {
    const clientEnvs = collectFilledClientEnvs();
    if (clientEnvs === null) {
      return;
    }

    confirm({
      content: $t('payment.merchant.codeConfig.codeConfig.saveConfirm'),
      async onOk() {
        await CodeConfigApi.saveOrUpdate({
          mchNo: mchNo.value,
          appId: appId.value,
          level: editLevel.value,
          clientEnvs,
        });
        message.success($t('common.operationSuccess'));
        editing.value = false;
        await loadConfig();
      },
    });
  }

  function cancel() {
    editing.value = false;
    initSceneForm();
    editLevel.value = effectiveLevel.value as CodeLevel;
  }

  watch(editLevel, async (level, prev) => {
    if (!editing.value || level === prev) return;
    if (level === CODE_LEVEL.METHOD) {
      await loadMethodDirectory();
    } else if (level === CODE_LEVEL.DIRECT) {
      await loadChannelMchCandidates();
    }
  });

  async function onChannelMchChange(clientEnv: string, payForm: CodePayForm, channelMchNo: any) {
    const sd = getRow(clientEnv, payForm);
    sd.channelMchNo = channelMchNo || '';
    sd.capability = '';
    if (channelMchNo) {
      await loadCapabilityForRow(clientEnv, payForm, channelMchNo);
    } else {
      const key = rowKey(clientEnv, payForm);
      capabilityMap.value = { ...capabilityMap.value, [key]: [] };
    }
  }

  onMounted(async () => {
    await loadApps();
    await loadAppInfo();
    await loadConfig();
  });

  // 切换应用时重载
  watch(appId, async () => {
    editing.value = false;
    await loadAppInfo();
    await loadConfig();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold">{{ $t('menu.payment.merchant.codePayConfig') }}</span>
          <span v-if="appName" class="text-sm text-muted-foreground"> ({{ appName }}) </span>
        </div>
      </template>

      <MchAppSelectorBar
        :value="appId"
        :options="appOptions"
        :loading="appsLoading"
        @update:value="setAppId"
      />

      <a-empty v-if="!appsLoading && !hasApps" :description="$t('payment.merchant.app.app.emptyApps')" />


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
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium">{{ $t('payment.merchant.codeConfig.codeConfig.editModeLabel') }}</span>
          <a-radio-group v-model:value="editLevel" button-style="solid" :disabled="!editing">
            <a-radio-button :value="CODE_LEVEL.AUTO">
              {{ $t('payment.merchant.codeConfig.codeConfig.modeAuto') }}
            </a-radio-button>
            <a-radio-button :value="CODE_LEVEL.METHOD">
              {{ $t('payment.merchant.codeConfig.codeConfig.modeMethod') }}
            </a-radio-button>
            <a-radio-button :value="CODE_LEVEL.DIRECT">
              {{ $t('payment.merchant.codeConfig.codeConfig.modeDirect') }}
            </a-radio-button>
          </a-radio-group>
          <a-tag v-if="isLevelActive && !editing" color="green">
            {{ $t('payment.merchant.codeConfig.codeConfig.levelActive') }}
          </a-tag>
        </div>

        <div class="mb-4">
          <a-alert :message="modeHint" type="info" show-icon />
        </div>

        <div v-if="showRoutePreview" class="mb-5 flex flex-wrap items-center gap-3 text-sm">
          <span class="text-muted-foreground"
            >{{ $t('payment.merchant.codeConfig.codeConfig.currentRouteMode') }}:</span
          >
          <a-tag color="blue">{{ routeModeLabel }}</a-tag>
          <template v-if="routeCoverage">
            <span class="text-muted-foreground">
              {{
                $t('payment.merchant.codeConfig.codeConfig.routeCoverage', {
                  ok: routeCoverage.ok,
                  total: routeCoverage.total,
                })
              }}
            </span>
            <span v-if="routeCoverage.gapLabels.length > 0" class="text-xs text-orange-500">
              {{ $t('payment.merchant.codeConfig.codeConfig.routeGaps') }}:
              {{ routeCoverage.gapLabels.join(' · ') }}
            </span>
          </template>
          <a-button type="link" size="small" class="!px-1" @click="goPayRoute">
            {{ $t('payment.merchant.codeConfig.codeConfig.goPayRoute') }}
            <IconifyIcon icon="ant-design:right-outlined" class="inline" />
          </a-button>
        </div>

        <!-- 按打开环境分块；块内 H5/小程序单行；AUTO 同 method 合并 -->
        <div class="env-blocks">
          <div v-for="sc in CODE_CLIENT_ENVS" :key="sc.clientEnv" class="env-block">
            <div class="env-block-title">{{ clientEnvLabel(sc.clientEnv) }}</div>

            <div class="env-table" :class="showRoutePreview ? 'cols-route' : 'cols-direct'">
              <div class="env-grid-header">
                <div>{{ $t('payment.merchant.codeConfig.codeConfig.payForm') }}</div>
                <div v-if="showRoutePreview">{{ $t('payment.merchant.codeConfig.codeConfig.method') }}</div>
                <div>{{ $t('payment.merchant.route.route.channelMerchant') }}</div>
                <div>{{ $t('payment.merchant.route.route.payCapability') }}</div>
              </div>

              <div v-for="drow in displayFormRows(sc.clientEnv)" :key="drow.key" class="env-grid-row">
                <!-- 形态：合并时展示 H5 + 小程序 -->
                <div class="form-tags">
                  <template v-if="drow.merged">
                    <a-tag color="blue" class="!m-0">{{ payFormLabel(CODE_PAY_FORM.H5) }}</a-tag>
                    <span class="text-muted-foreground text-xs">/</span>
                    <a-tag color="purple" class="!m-0">{{ payFormLabel(CODE_PAY_FORM.MINI) }}</a-tag>
                  </template>
                  <a-tag v-else :color="drow.primaryForm === CODE_PAY_FORM.MINI ? 'purple' : 'blue'" class="!m-0">
                    {{ payFormLabel(drow.primaryForm) }}
                  </a-tag>
                </div>

                <!-- AUTO -->
                <template v-if="editLevel === CODE_LEVEL.AUTO">
                  <div
                    class="cell-text"
                    :title="findMethodLabel(sc.provider, defaultMethodFor(sc.clientEnv, drow.primaryForm))"
                  >
                    {{ findMethodLabel(sc.provider, defaultMethodFor(sc.clientEnv, drow.primaryForm)) }}
                  </div>
                  <RouteHitPreviewBlock
                    :hit="previewRouteHit(sc.provider, defaultMethodFor(sc.clientEnv, drow.primaryForm))"
                    :empty-tone="emptyToneFor(sc.provider, sc.clientEnv, drow.primaryForm)"
                    i18n-prefix="payment.merchant.codeConfig.codeConfig"
                  />
                </template>

                <!-- METHOD：始终按 primaryForm 单行（未合并） -->
                <template v-else-if="editLevel === CODE_LEVEL.METHOD">
                  <div>
                    <a-select
                      :value="getRow(sc.clientEnv, drow.primaryForm).method"
                      :options="methodOptions(sc.provider)"
                      :placeholder="$t('payment.merchant.codeConfig.codeConfig.methodPlaceholder')"
                      :disabled="!editing"
                      allow-clear
                      class="w-full min-w-[160px]"
                      @change="(val: any) => (getRow(sc.clientEnv, drow.primaryForm).method = val || '')"
                    />
                  </div>
                  <RouteHitPreviewBlock
                    :hit="previewRouteHit(sc.provider, resolveMethodForRow(sc.clientEnv, drow.primaryForm))"
                    :empty-tone="emptyToneFor(sc.provider, sc.clientEnv, drow.primaryForm)"
                    i18n-prefix="payment.merchant.codeConfig.codeConfig"
                  />
                </template>

                <!-- DIRECT -->
                <template v-else>
                  <div>
                    <ChannelMerchantSelect
                      :value="getRow(sc.clientEnv, drow.primaryForm).channelMchNo"
                      :options="channelMchOptions(sc.clientEnv, drow.primaryForm)"
                      :placeholder="$t('payment.merchant.codeConfig.codeConfig.channelMerchantPlaceholder')"
                      :disabled="!editing"
                      root-class-name="w-full min-w-[160px]"
                      @change="(val: any) => onChannelMchChange(sc.clientEnv, drow.primaryForm, val)"
                    />
                  </div>
                  <div>
                    <a-select
                      :value="getRow(sc.clientEnv, drow.primaryForm).capability"
                      :options="capabilityOptions(sc.clientEnv, drow.primaryForm)"
                      :placeholder="$t('payment.merchant.codeConfig.codeConfig.capabilityPlaceholder')"
                      :disabled="!editing || !getRow(sc.clientEnv, drow.primaryForm).channelMchNo"
                      allow-clear
                      class="w-full min-w-[160px]"
                      @change="(val: any) => (getRow(sc.clientEnv, drow.primaryForm).capability = val)"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped>
  .env-blocks {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .env-block {
    padding: 12px 14px 14px;
    background: hsl(var(--muted) / 0.3);
    border-radius: 12px;
  }

  .env-block-title {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
  }

  .env-table {
    min-width: 0;
    overflow-x: auto;
  }

  /* 形态 | 支付方式 | 通道商户 | 支付能力 */
  .env-table.cols-route .env-grid-header,
  .env-table.cols-route .env-grid-row {
    grid-template-columns: minmax(100px, 0.7fr) minmax(140px, 1fr) minmax(140px, 1.2fr) minmax(120px, 1fr);
  }

  /* 形态 | 通道商户 | 支付能力 */
  .env-table.cols-direct .env-grid-header,
  .env-table.cols-direct .env-grid-row {
    grid-template-columns: minmax(100px, 0.7fr) minmax(160px, 1.2fr) minmax(160px, 1.2fr);
  }

  .env-grid-header,
  .env-grid-row {
    display: grid;
    align-items: center;
    gap: 12px 16px;
  }

  .env-grid-header {
    padding: 0 10px 8px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }

  .env-grid-row {
    padding: 8px 10px;
    margin-bottom: 6px;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
  }

  .env-grid-row:last-child {
    margin-bottom: 0;
  }

  .form-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .cell-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
</style>

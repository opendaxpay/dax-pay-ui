<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type LabelValue, PayRouteApi, type PayRouteSceneConfigItem } from '#/api/payment/route/pay-route.api';
  import { useMessage } from '#/hooks/useMessage';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';
  import { usePayProviderMethodDirectory } from '#/views/payment/shared/usePayProviderMethodDirectory';

  import { providerLabel } from '../shared/payRoute.labels';

  defineOptions({ name: 'PayRouteScenePanel' });

  // 场景模式：按支付渠道支付方式目录配置，每行绑定通道商户与支付能力
  const props = defineProps<{
    appId: string;
  }>();

  const { confirm, message } = useMessage();
  const { loadDirectory, directoryByProviderCards } = usePayProviderMethodDirectory();

  // 场景模式内存行：提交项 + 派生 provider(目录维度，用于行定位与候选缓存键，不提交后端)
  type SceneRow = PayRouteSceneConfigItem & { provider: string };

  // 支付方式 → 支付渠道 映射(从目录派生，用于回显时填充内存行的 provider)
  const methodToProvider = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const card of directoryByProviderCards()) {
      for (const entry of card.methods) {
        map[entry.method] = entry.provider;
      }
    }
    return map;
  });

  const sceneRows = ref<SceneRow[]>([]);
  const sceneChannelMchOptionsMap = ref<Record<string, LabelValue[]>>({});
  const sceneCapabilityOptionsMap = ref<Record<string, LabelValue[]>>({});
  // 编辑态由父组件持有（v-model:editing），编辑/保存/取消按钮置于 a-tabs 标签行右侧
  const editing = defineModel<boolean>('editing', { default: false });

  // 通道商户候选缓存键
  function channelMchOptionsKey(provider: string, method: string) {
    return `${provider}|${method}`;
  }

  // 能力候选缓存键（含通道商户号）
  function capabilityOptionsKey(provider: string, method: string, channelMchNo: string) {
    return `${provider}|${method}|${channelMchNo}`;
  }

  function sceneNotSelectedText() {
    return $t('payment.merchant.route.route.sceneRouteNotSelected');
  }

  function findSceneRow(provider: string, method: string): SceneRow | undefined {
    return sceneRows.value.find((row) => row.provider === provider && row.method === method);
  }

  function getSceneRow(provider: string, method: string): SceneRow {
    const existing = findSceneRow(provider, method);
    if (existing) {
      return existing;
    }
    const row: SceneRow = {
      provider,
      method,
      channelMchNo: '',
      capability: '',
    };
    sceneRows.value.push(row);
    return row;
  }

  function sceneChannelMchDisplay(provider: string, method: string) {
    const channelMchNo = findSceneRow(provider, method)?.channelMchNo;
    if (!channelMchNo) {
      return sceneNotSelectedText();
    }
    const option = sceneChannelMchOptions(provider, method).find((item) => item.value === channelMchNo);
    return option?.label || channelMchNo;
  }

  function sceneCapabilityDisplay(provider: string, method: string) {
    const row = findSceneRow(provider, method);
    const capability = row?.capability;
    if (!capability) {
      return sceneNotSelectedText();
    }
    const channelMchNo = row?.channelMchNo;
    if (!channelMchNo) {
      return capability;
    }
    const option = sceneCapabilityOptions(provider, method, channelMchNo).find((item) => item.value === capability);
    return option?.label || capability;
  }

  async function loadSceneChannelMch(provider: string, method: string) {
    if (!props.appId) {
      return;
    }
    const key = channelMchOptionsKey(provider, method);
    if (sceneChannelMchOptionsMap.value[key]) {
      return;
    }
    const { data } = await PayRouteApi.listSceneChannelMchCandidates({
      appId: props.appId,
      provider,
      method,
    });
    sceneChannelMchOptionsMap.value[key] = data || [];
  }

  async function loadSceneCapabilities(provider: string, method: string, channelMchNo: string) {
    if (!props.appId || !channelMchNo) {
      return;
    }
    const key = capabilityOptionsKey(provider, method, channelMchNo);
    if (sceneCapabilityOptionsMap.value[key]) {
      return;
    }
    const { data } = await PayRouteApi.listSceneCapabilityCandidates({
      appId: props.appId,
      provider,
      method,
      channelMchNo,
    });
    sceneCapabilityOptionsMap.value[key] = data || [];
  }

  function sceneChannelMchOptions(provider: string, method: string) {
    return sceneChannelMchOptionsMap.value[channelMchOptionsKey(provider, method)] || [];
  }

  function sceneCapabilityOptions(provider: string, method: string, channelMchNo: string) {
    return sceneCapabilityOptionsMap.value[capabilityOptionsKey(provider, method, channelMchNo)] || [];
  }

  function sceneChannelMchSelectOptions(provider: string, method: string) {
    return sceneChannelMchOptions(provider, method).map((item) => ({
      label: item.label || item.value,
      value: item.value,
    }));
  }

  function sceneCapabilitySelectOptions(provider: string, method: string, channelMchNo: string) {
    return sceneCapabilityOptions(provider, method, channelMchNo).map((item) => ({
      label: item.label || item.value,
      value: item.value,
    }));
  }

  /** 切换或清空通道商户时清空能力；有通道商户时刷新能力候选 */
  function onSceneChannelMchChange(provider: string, method: string) {
    const row = getSceneRow(provider, method);
    row.capability = '';
    // 清除该支付方式下所有能力缓存(能力依赖通道商户号)
    const prefix = `${provider}|${method}|`;
    for (const k of Object.keys(sceneCapabilityOptionsMap.value)) {
      if (k.startsWith(prefix)) {
        delete sceneCapabilityOptionsMap.value[k];
      }
    }
    if (!row.channelMchNo) {
      return;
    }
    loadSceneCapabilities(provider, method, row.channelMchNo);
  }

  /** 按支付渠道支付方式目录补齐内存行，保证保存时可提交完整目录项 */
  function ensureDirectoryRows() {
    for (const card of directoryByProviderCards()) {
      for (const entry of card.methods) {
        getSceneRow(entry.provider, entry.method);
      }
    }
  }

  /** 根据批量候选 Map 回显唯一支付能力（仅展示） */
  function applyInferredCapabilitiesFromBatch() {
    for (const row of sceneRows.value) {
      if (!row.provider || !row.method || !row.channelMchNo || row.capability) {
        continue;
      }
      const key = capabilityOptionsKey(row.provider, row.method, row.channelMchNo);
      const options = sceneCapabilityOptionsMap.value[key];
      if (options?.length === 1 && options[0]?.value) {
        row.capability = options[0].value;
      }
    }
  }

  async function loadSceneConfig() {
    if (!props.appId) {
      return;
    }
    await loadDirectory();
    const { data: configs } = await PayRouteApi.listSceneConfig(props.appId);
    sceneRows.value = (configs || [])
      .filter((c) => c.method)
      .map((c) => ({
        provider: methodToProvider.value[c.method!] || '',
        method: c.method!,
        channelMchNo: c.channelMchNo || '',
        capability: c.capability || '',
      }));
    ensureDirectoryRows();
    sceneChannelMchOptionsMap.value = {};
    sceneCapabilityOptionsMap.value = {};
    const { data: channelMchBatch } = await PayRouteApi.listSceneChannelMchCandidatesBatch({
      appId: props.appId,
    });
    sceneChannelMchOptionsMap.value = channelMchBatch || {};
    const capabilityItems = sceneRows.value
      .filter((row) => row.provider && row.method && row.channelMchNo)
      .map((row) => ({
        provider: row.provider!,
        method: row.method!,
        channelMchNo: row.channelMchNo!,
      }));
    if (capabilityItems.length > 0) {
      const { data: capabilityBatch } = await PayRouteApi.listSceneCapabilityCandidatesBatch({
        appId: props.appId,
        items: capabilityItems,
      });
      sceneCapabilityOptionsMap.value = capabilityBatch || {};
    }
    applyInferredCapabilitiesFromBatch();
  }

  async function reload() {
    await loadSceneConfig();
  }

  function startSceneConfigEdit() {
    editing.value = true;
    ensureDirectoryRows();
  }

  async function doCancelSceneConfigEdit() {
    editing.value = false;
    await loadSceneConfig();
  }

  /** 取消编辑前二次确认 */
  function cancelSceneConfigEdit() {
    confirm({
      // 国际化：取消编辑二次确认
      content: $t('common.confirmCancelContent'),
      onOk() {
        return doCancelSceneConfigEdit();
      },
    });
  }

  function resetEditing() {
    editing.value = false;
  }

  /** 目录行是否已完整配置（通道商户与能力同时有值） */
  function isSceneRowFullyConfigured(row: PayRouteSceneConfigItem) {
    return !!(row.channelMchNo && row.capability);
  }

  /** 目录行是否未配置（通道商户与能力同时为空） */
  function isSceneRowEmpty(row: PayRouteSceneConfigItem) {
    return !row.channelMchNo && !row.capability;
  }

  /** 校验：不可只配置通道商户或只配置能力 */
  function validateSceneRowPairing() {
    for (const card of directoryByProviderCards()) {
      for (const entry of card.methods) {
        const row = getSceneRow(entry.provider, entry.method);
        if (!isSceneRowEmpty(row) && !isSceneRowFullyConfigured(row)) {
          message.error($t('payment.merchant.route.route.sceneChannelMchCapabilityPairHint'));
          return false;
        }
      }
    }
    return true;
  }

  /** 保存场景模式配置（校验通过后由确认框回调执行） */
  async function doSaveSceneConfig() {
    const directoryItems = directoryByProviderCards().flatMap((card) =>
      card.methods.map((entry) => getSceneRow(entry.provider, entry.method)),
    );
    await PayRouteApi.saveSceneBatch({
      appId: props.appId,
      items: directoryItems
        .filter((r) => r.method && (isSceneRowEmpty(r) || isSceneRowFullyConfigured(r)))
        .map((r) => ({
          method: r.method,
          channelMchNo: r.channelMchNo,
          capability: r.capability,
        })),
    });
    message.success($t('common.operationSuccess'));
    editing.value = false;
    await loadSceneConfig();
  }

  /** 保存前二次确认 */
  function saveSceneConfig() {
    if (!props.appId) {
      return;
    }
    if (!validateSceneRowPairing()) {
      return;
    }
    confirm({
      // 国际化：场景模式保存二次确认
      content: $t('payment.merchant.route.route.sceneSaveConfirm'),
      onOk() {
        return doSaveSceneConfig();
      },
    });
  }

  defineExpose({
    reload,
    resetEditing,
    startEdit: startSceneConfigEdit,
    save: saveSceneConfig,
    cancel: cancelSceneConfigEdit,
  });
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div v-for="card in directoryByProviderCards()" :key="card.code" class="vendor-card rounded-xl border p-4">
      <div class="mb-3 flex items-center gap-2 font-medium">
        <img :src="getProviderSvgUrl(card.code)" class="w-5 h-5" :alt="card.code" />
        {{ providerLabel(card.code) }}
      </div>
      <div
        class="mb-2 grid grid-cols-[minmax(8rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)] gap-2 text-xs text-muted-foreground"
      >
        <span>{{ $t('payment.merchant.route.route.method') }}</span>
        <span>{{ $t('payment.merchant.route.route.channelMerchant') }}</span>
        <span>{{ $t('payment.merchant.route.route.payCapability') }}</span>
      </div>
      <div
        v-for="entry in card.methods"
        :key="channelMchOptionsKey(entry.provider, entry.method)"
        class="mb-2 grid grid-cols-[minmax(8rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)] items-start gap-2"
      >
        <div class="min-h-8 py-1.5 text-sm">
          {{ entry.methodLabel || entry.method }}
        </div>
        <template v-if="!editing">
          <div class="min-h-8 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm">
            {{ sceneChannelMchDisplay(entry.provider, entry.method) }}
          </div>
          <div class="min-h-8 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm">
            {{ sceneCapabilityDisplay(entry.provider, entry.method) }}
          </div>
        </template>
        <template v-else>
          <a-select
            v-model:value="getSceneRow(entry.provider, entry.method).channelMchNo"
            allow-clear
            class="w-full"
            :placeholder="$t('payment.merchant.route.route.channelMerchantPlaceholder')"
            :options="sceneChannelMchSelectOptions(entry.provider, entry.method)"
            @change="onSceneChannelMchChange(entry.provider, entry.method)"
            @focus="loadSceneChannelMch(entry.provider, entry.method)"
          >
            <template #notFoundContent>
              {{ $t('payment.merchant.route.route.channelMerchantNotFound') }}
            </template>
          </a-select>
          <a-select
            v-model:value="getSceneRow(entry.provider, entry.method).capability"
            allow-clear
            class="w-full"
            :placeholder="$t('payment.merchant.route.route.payCapabilityPlaceholder')"
            :options="
              sceneCapabilitySelectOptions(
                entry.provider,
                entry.method,
                getSceneRow(entry.provider, entry.method).channelMchNo || '',
              )
            "
            @focus="
              loadSceneCapabilities(
                entry.provider,
                entry.method,
                getSceneRow(entry.provider, entry.method).channelMchNo || '',
              )
            "
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type LabelValue, PayRouteApi, type PayRouteSceneConfigItem } from '#/api/payment/route/pay-route.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';
  import { usePayProviderMethodDirectory } from '#/views/payment/shared/usePayProviderMethodDirectory';
  import { providerLabel } from '../shared/payRoute.labels';

  defineOptions({ name: 'PayRouteScenePanel' });

  // 场景模式：按品牌支付方式目录配置，每行绑定支付产品与支付能力
  const props = defineProps<{
    appId: string;
    productNameMap: Record<string, string>;
  }>();

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const { loadDirectory, directoryByProviderCards } = usePayProviderMethodDirectory();

  const sceneRows = ref<PayRouteSceneConfigItem[]>([]);
  const sceneProductOptionsMap = ref<Record<string, LabelValue[]>>({});
  const sceneCapabilityOptionsMap = ref<Record<string, LabelValue[]>>({});
  const sceneConfigEditing = ref(false);

  // 产品候选缓存键
  function productOptionsKey(provider: string, method: string) {
    return `${provider}|${method}`;
  }

  // 能力候选缓存键（含产品）
  function capabilityOptionsKey(provider: string, method: string, product: string) {
    return `${provider}|${method}|${product}`;
  }

  function sceneNotSelectedText() {
    return $t('payment.merchant.route.route.sceneRouteNotSelected');
  }

  function findSceneRow(provider: string, method: string): PayRouteSceneConfigItem | undefined {
    return sceneRows.value.find((row) => row.provider === provider && row.method === method);
  }

  function getSceneRow(provider: string, method: string): PayRouteSceneConfigItem {
    const existing = findSceneRow(provider, method);
    if (existing) {
      return existing;
    }
    const row: PayRouteSceneConfigItem = {
      provider,
      method,
      product: '',
      capability: '',
    };
    sceneRows.value.push(row);
    return row;
  }

  function sceneProductDisplay(provider: string, method: string) {
    const product = findSceneRow(provider, method)?.product;
    if (!product) {
      return sceneNotSelectedText();
    }
    const option = sceneProductOptions(provider, method).find((item) => item.value === product);
    return option?.label || props.productNameMap[product] || product;
  }

  function sceneCapabilityDisplay(provider: string, method: string) {
    const capability = findSceneRow(provider, method)?.capability;
    if (!capability) {
      return sceneNotSelectedText();
    }
    const product = findSceneRow(provider, method)?.product;
    if (!product) {
      return capability;
    }
    const option = sceneCapabilityOptions(provider, method, product).find((item) => item.value === capability);
    return option?.label || capability;
  }

  async function loadSceneProducts(provider: string, method: string) {
    if (!props.appId) {
      return;
    }
    const key = productOptionsKey(provider, method);
    if (sceneProductOptionsMap.value[key]) {
      return;
    }
    const { data } = await PayRouteApi.listSceneProductCandidates({
      appId: props.appId,
      provider,
      method,
    });
    sceneProductOptionsMap.value[key] = data || [];
  }

  async function loadSceneCapabilities(provider: string, method: string, product: string) {
    if (!props.appId || !product) {
      return;
    }
    const key = capabilityOptionsKey(provider, method, product);
    if (sceneCapabilityOptionsMap.value[key]) {
      return;
    }
    const { data } = await PayRouteApi.listSceneCapabilityCandidates({
      appId: props.appId,
      provider,
      method,
      product,
    });
    sceneCapabilityOptionsMap.value[key] = data || [];
  }

  function sceneProductOptions(provider: string, method: string) {
    return sceneProductOptionsMap.value[productOptionsKey(provider, method)] || [];
  }

  function sceneCapabilityOptions(provider: string, method: string, product: string) {
    return sceneCapabilityOptionsMap.value[capabilityOptionsKey(provider, method, product)] || [];
  }

  function sceneProductSelectOptions(provider: string, method: string) {
    return sceneProductOptions(provider, method).map((item) => ({
      label: item.label || item.value,
      value: item.value,
    }));
  }

  function sceneCapabilitySelectOptions(provider: string, method: string, product: string) {
    return sceneCapabilityOptions(provider, method, product).map((item) => ({
      label: item.label || item.value,
      value: item.value,
    }));
  }

  /** 切换或清空支付产品时清空能力；有产品时刷新能力候选 */
  function onSceneProductChange(provider: string, method: string) {
    const row = getSceneRow(provider, method);
    row.capability = '';
    if (!row.product) {
      return;
    }
    const capKey = capabilityOptionsKey(provider, method, row.product);
    delete sceneCapabilityOptionsMap.value[capKey];
    loadSceneCapabilities(provider, method, row.product);
  }

  /** 按品牌支付方式目录补齐内存行，保证保存时可提交完整目录项 */
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
      if (!row.provider || !row.method || !row.product || row.capability) {
        continue;
      }
      const key = capabilityOptionsKey(row.provider, row.method, row.product);
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
      .filter((c) => c.provider && c.method)
      .map((c) => ({
        provider: c.provider,
        method: c.method,
        product: c.product,
        capability: '',
        channel: c.channel,
      }));
    ensureDirectoryRows();
    sceneProductOptionsMap.value = {};
    sceneCapabilityOptionsMap.value = {};
    const { data: productBatch } = await PayRouteApi.listSceneProductCandidatesBatch({
      appId: props.appId,
    });
    sceneProductOptionsMap.value = productBatch || {};
    const capabilityItems = sceneRows.value
      .filter((row) => row.provider && row.method && row.product)
      .map((row) => ({
        provider: row.provider!,
        method: row.method!,
        product: row.product!,
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
    sceneConfigEditing.value = true;
    ensureDirectoryRows();
  }

  async function doCancelSceneConfigEdit() {
    sceneConfigEditing.value = false;
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
    sceneConfigEditing.value = false;
  }

  /** 目录行是否已完整配置（产品与能力同时有值） */
  function isSceneRowFullyConfigured(row: PayRouteSceneConfigItem) {
    return !!(row.product && row.capability);
  }

  /** 目录行是否未配置（产品与能力同时为空） */
  function isSceneRowEmpty(row: PayRouteSceneConfigItem) {
    return !row.product && !row.capability;
  }

  /** 校验：不可只配置产品或只配置能力 */
  function validateSceneRowPairing() {
    for (const card of directoryByProviderCards()) {
      for (const entry of card.methods) {
        const row = getSceneRow(entry.provider, entry.method);
        if (!isSceneRowEmpty(row) && !isSceneRowFullyConfigured(row)) {
          message.error($t('payment.merchant.route.route.sceneProductCapabilityPairHint'));
          return false;
        }
      }
    }
    return true;
  }

  /** 保存场景模式配置（校验通过后由确认框回调执行） */
  async function doSaveSceneConfig() {
    const { data: allConfigs } = await PayRouteApi.listSceneConfig(props.appId!);
    // 历史通用行：无 provider，仅 channel+method
    const genericRows = (allConfigs || []).filter((c) => !c.provider && c.channel && c.method);
    const directoryItems = directoryByProviderCards().flatMap((card) =>
      card.methods.map((entry) => getSceneRow(entry.provider, entry.method)),
    );
    await PayRouteApi.saveSceneBatch({
      appId: props.appId,
      items: [
        ...directoryItems.filter(
          (r) => r.provider && r.method && (isSceneRowEmpty(r) || isSceneRowFullyConfigured(r)),
        ),
        ...genericRows.map((c) => ({
          provider: c.provider,
          product: c.product,
          channel: c.channel,
          method: c.method,
        })),
      ],
    });
    message.success($t('common.operationSuccess'));
    sceneConfigEditing.value = false;
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
  });
</script>

<template>
  <div>
    <div v-for="card in directoryByProviderCards()" :key="card.code" class="vendor-card mb-4 rounded-xl border p-4">
      <div class="mb-3 flex items-center gap-2 font-medium">
        <img :src="getProviderSvgUrl(card.code)" class="w-5 h-5" :alt="card.code" />
        {{ providerLabel(card.code) }}
      </div>
      <div
        class="mb-2 grid grid-cols-[minmax(8rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)] gap-2 text-xs text-muted-foreground"
      >
        <span>{{ $t('payment.merchant.route.route.method') }}</span>
        <span>{{ $t('payment.merchant.route.route.basicProduct') }}</span>
        <span>{{ $t('payment.merchant.route.route.payCapability') }}</span>
      </div>
      <div
        v-for="entry in card.methods"
        :key="productOptionsKey(entry.provider, entry.method)"
        class="mb-2 grid grid-cols-[minmax(8rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)] items-start gap-2"
      >
        <div class="min-h-8 py-1.5 text-sm">
          {{ entry.methodLabel || entry.method }}
        </div>
        <template v-if="!sceneConfigEditing">
          <div class="min-h-8 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm">
            {{ sceneProductDisplay(entry.provider, entry.method) }}
          </div>
          <div class="min-h-8 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm">
            {{ sceneCapabilityDisplay(entry.provider, entry.method) }}
          </div>
        </template>
        <template v-else>
          <a-select
            v-model:value="getSceneRow(entry.provider, entry.method).product"
            allow-clear
            class="w-full"
            :placeholder="$t('payment.merchant.route.route.basicProductPlaceholder')"
            :options="sceneProductSelectOptions(entry.provider, entry.method)"
            @change="onSceneProductChange(entry.provider, entry.method)"
            @focus="loadSceneProducts(entry.provider, entry.method)"
          />
          <a-select
            v-model:value="getSceneRow(entry.provider, entry.method).capability"
            allow-clear
            class="w-full"
            :placeholder="$t('payment.merchant.route.route.payCapabilityPlaceholder')"
            :options="
              sceneCapabilitySelectOptions(
                entry.provider,
                entry.method,
                getSceneRow(entry.provider, entry.method).product || '',
              )
            "
            @focus="
              loadSceneCapabilities(
                entry.provider,
                entry.method,
                getSceneRow(entry.provider, entry.method).product || '',
              )
            "
          />
        </template>
      </div>
    </div>
    <div v-if="hasPermission(PermCodes.Payment.AppPayRoute.EDIT)" class="mt-4 flex gap-2">
      <a-button v-if="!sceneConfigEditing" type="primary" @click="startSceneConfigEdit">
        {{ $t('common.edit') }}
      </a-button>
      <template v-else>
        <a-button type="primary" @click="saveSceneConfig">
          {{ $t('common.save') }}
        </a-button>
        <a-button @click="cancelSceneConfigEdit">{{ $t('common.cancel') }}</a-button>
      </template>
    </div>
  </div>
</template>

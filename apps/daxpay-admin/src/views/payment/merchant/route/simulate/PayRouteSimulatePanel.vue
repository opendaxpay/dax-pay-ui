<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { PayRouteApi, type PayRouteSimulateParam } from '#/api/payment/payRoute.api';

  import { usePayProviderMethodDirectory } from '#/views/payment/shared/usePayProviderMethodDirectory';
  import { ROUTE_PAY_PROVIDERS, type PayRouteMode } from '../shared/payRoute.constants';
  import { modeDisplayName, providerLabel } from '../shared/payRoute.labels';

  defineOptions({ name: 'PayRouteSimulatePanel' });

  const props = defineProps<{
    appId: string;
    // 当前配置模式，作为试算 mode 传给后端（advanced 会返回暂未开放）
    editMode: PayRouteMode;
    mchNo: string;
  }>();

  const { loadDirectory, methodsForProvider } = usePayProviderMethodDirectory();

  const simulateParam = ref<PayRouteSimulateParam>({
    appId: '',
    mchNo: '',
    provider: 'wechat',
    method: 'wechat_jsapi',
    amount: 0.01,
  });
  const simulateResult = ref<string>('');

  const methodOptions = computed(() => {
    if (!simulateParam.value.provider) {
      return [];
    }
    return methodsForProvider(simulateParam.value.provider).map((item) => ({
      label: item.methodLabel || item.method,
      value: item.method,
    }));
  });

  function syncContextIds() {
    simulateParam.value.appId = props.appId;
    simulateParam.value.mchNo = props.mchNo;
  }

  /** 按 editMode 试算路由解析结果（不写真实订单） */
  async function runSimulate() {
    syncContextIds();
    simulateParam.value.mode = props.editMode;
    const { data } = await PayRouteApi.simulate(simulateParam.value);
    simulateResult.value = JSON.stringify(data, null, 2);
  }

  watch(
    () => simulateParam.value.provider,
    async (provider) => {
      await loadDirectory();
      const methods = methodsForProvider(provider || '');
      if (methods.length && !methods.some((m) => m.method === simulateParam.value.method)) {
        simulateParam.value.method = methods[0]!.method;
      }
    },
  );

  watch(
    () => [props.appId, props.mchNo] as const,
    async () => {
      syncContextIds();
      await loadDirectory();
    },
    { immediate: true },
  );

  defineExpose({
    syncContextIds,
  });
</script>

<template>
  <div>
    <p class="mb-3 text-sm text-muted-foreground">
      {{
        $t('payment.merchant.route.route.simulateUsesEditMode', {
          mode: modeDisplayName(editMode),
        })
      }}
    </p>
    <div class="mb-4 flex flex-wrap gap-4">
      <a-select
        v-if="editMode === 'basic' || editMode === 'scene'"
        v-model:value="simulateParam.provider"
        class="w-40"
        allow-clear
        :placeholder="$t('payment.merchant.route.route.simulateProvider')"
        :options="ROUTE_PAY_PROVIDERS.map((v) => ({ label: providerLabel(v.code), value: v.code }))"
      />
      <a-select
        v-if="editMode === 'scene'"
        v-model:value="simulateParam.method"
        class="w-48"
        allow-clear
        :placeholder="$t('payment.merchant.route.route.method')"
        :options="methodOptions"
      />
      <a-input-number v-model:value="simulateParam.amount" :min="0.01" class="w-32" />
      <a-button type="primary" @click="runSimulate">
        {{ $t('payment.merchant.route.route.simulate') }}
      </a-button>
    </div>
    <pre v-if="simulateResult" class="rounded bg-muted p-4 text-sm">{{ simulateResult }}</pre>
  </div>
</template>

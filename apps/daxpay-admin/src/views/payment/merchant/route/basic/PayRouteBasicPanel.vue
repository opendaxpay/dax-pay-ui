<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PayRouteApi, type PayRouteBasicConfigResult } from '#/api/payment/route/pay-route.api';
  import { useMessage } from '#/hooks/useMessage';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  import { ROUTE_PAY_PROVIDERS } from '../shared/payRoute.constants';
  import { providerLabel } from '../shared/payRoute.labels';

  defineOptions({ name: 'PayRouteBasicPanel' });

  // 基础模式：按支付渠道配置默认通道商户
  const props = defineProps<{
    appId: string;
  }>();

  const { confirm, message } = useMessage();

  const basicConfigRows = ref<PayRouteBasicConfigResult[]>([]);
  const basicConfigMap = ref<Record<string, string | undefined>>({});
  // 编辑态由父组件持有（v-model:editing），编辑/保存/取消按钮置于 a-tabs 标签行右侧
  const editing = defineModel<boolean>('editing', { default: false });

  async function loadBasicConfig() {
    if (!props.appId) {
      return;
    }
    const { data } = await PayRouteApi.listBasicConfig(props.appId);
    basicConfigRows.value = (data || []) as PayRouteBasicConfigResult[];
    const map: Record<string, string | undefined> = {};
    for (const vendor of ROUTE_PAY_PROVIDERS) {
      map[vendor.code] = undefined;
    }
    for (const row of basicConfigRows.value) {
      if (row.provider) {
        map[row.provider] = row.channelMchNo;
      }
    }
    basicConfigMap.value = map;
  }

  async function reload() {
    await loadBasicConfig();
  }

  function vendorChannelMchOptions(vendor: string) {
    const mchants = basicConfigRows.value.find((item) => item.provider === vendor)?.channelMchants || [];
    return mchants.map((item) => ({
      label: item.label || item.value,
      value: item.value,
    }));
  }

  function basicChannelMchDisplay(vendor: string) {
    const code = basicConfigMap.value[vendor];
    if (!code) {
      return $t('payment.merchant.route.route.basicProductNotSelected');
    }
    const mchants = basicConfigRows.value.find((item) => item.provider === vendor)?.channelMchants || [];
    const option = mchants.find((item) => item.value === code);
    return option?.label || code;
  }

  function startBasicConfigEdit() {
    editing.value = true;
  }

  async function doCancelBasicConfigEdit() {
    editing.value = false;
    await loadBasicConfig();
  }

  /** 取消编辑前二次确认 */
  function cancelBasicConfigEdit() {
    confirm({
      // 国际化：取消编辑二次确认
      content: $t('common.confirmCancelContent'),
      onOk() {
        return doCancelBasicConfigEdit();
      },
    });
  }

  function resetEditing() {
    editing.value = false;
  }

  async function doSaveBasicConfig() {
    await PayRouteApi.saveBasicBatch({
      appId: props.appId!,
      items: ROUTE_PAY_PROVIDERS.map((v) => ({
        provider: v.code,
        channelMchNo: basicConfigMap.value[v.code],
      })),
    });
    message.success($t('common.operationSuccess'));
    editing.value = false;
    await loadBasicConfig();
  }

  /** 保存前二次确认 */
  function saveBasicConfig() {
    if (!props.appId) {
      return;
    }
    confirm({
      // 国际化：基础模式保存二次确认
      content: $t('payment.merchant.route.route.basicSaveConfirm'),
      onOk() {
        return doSaveBasicConfig();
      },
    });
  }

  defineExpose({
    reload,
    resetEditing,
    startEdit: startBasicConfigEdit,
    save: saveBasicConfig,
    cancel: cancelBasicConfigEdit,
  });
</script>

<template>
  <div class="py-2">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="vendor in ROUTE_PAY_PROVIDERS" :key="vendor.code" class="vendor-card rounded-xl border p-4">
        <div class="mb-3 flex items-center gap-2">
          <img :src="getProviderSvgUrl(vendor.code)" class="w-6 h-6" :alt="vendor.code" />
          <span class="font-medium">{{ providerLabel(vendor.code) }}</span>
        </div>
        <div class="mt-3">
          <div class="mb-1 text-xs text-muted-foreground">
            {{ $t('payment.merchant.route.route.channelMerchant') }}
          </div>
          <div v-if="!editing" class="min-h-8 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm">
            {{ basicChannelMchDisplay(vendor.code) }}
          </div>
          <template v-else>
            <a-select
              v-model:value="basicConfigMap[vendor.code]"
              class="w-full"
              allow-clear
              :placeholder="$t('payment.merchant.route.route.channelMerchantPlaceholder')"
              :options="vendorChannelMchOptions(vendor.code)"
            >
              <template #notFoundContent>
                {{ $t('payment.merchant.route.route.channelMerchantNotFound') }}
              </template>
            </a-select>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

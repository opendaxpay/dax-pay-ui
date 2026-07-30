<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayDirectAppCapabilityApi,
    type AlipayDirectAppCapabilityItem,
    type AlipayDirectCapabilityOption,
  } from '#/api/payment/alipay/alipay-direct-app-capability.api';
  import { AlipayDirectAppApi, type AlipayDirectAppResult } from '#/api/payment/alipay/alipay-direct-app.api';
  import { useMessage } from '#/hooks/useMessage';

  import { isAlipayAppCompatible, resolveAlipayAppTypeByCapability } from './alipay-app-type';

  defineOptions({ name: 'AlipayMchAppCapability' });

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();
  const visible = ref(false);
  const loading = ref(false);
  const channelMchNo = ref('');
  // 支付能力候选列表
  const capabilities = ref<AlipayDirectCapabilityOption[]>([]);
  // 通道商户下全部应用
  const apps = ref<AlipayDirectAppResult[]>([]);
  // 当前绑定：capability → alipayDirectAppId
  const bindingMap = ref<Record<string, string | undefined>>({});

  const hasApps = computed(() => apps.value.length > 0);

  /** 应用类型 → 展示标签 */
  function appTypeLabel(appType?: string): string {
    switch (appType) {
      case 'mini_program': {
        return $t('payment.merchant.alipayDirectApp.appTypeMiniProgram');
      }
      case 'mobile_app': {
        return $t('payment.merchant.alipayDirectApp.appTypeMobileApp');
      }
      case 'web_app': {
        return $t('payment.merchant.alipayDirectApp.appTypeWebApp');
      }
      default: {
        return appType ?? '-';
      }
    }
  }

  /** 应用类型 → 标签颜色 */
  function appTypeColor(appType?: string): string {
    switch (appType) {
      case 'mini_program': {
        return 'blue';
      }
      case 'mobile_app': {
        return 'green';
      }
      case 'web_app': {
        return 'purple';
      }
      default: {
        return 'default';
      }
    }
  }

  function requiredAppType(capability: string): string[] {
    return resolveAlipayAppTypeByCapability(capability);
  }

  /** 下拉选项：仅兼容类型应用 */
  function appSelectOptions(capability: string) {
    return apps.value
      .filter((app) => isAlipayAppCompatible(app.appType, capability))
      .map((app) => ({
        value: app.id!,
        label: app.appName ? `${app.appName} (${app.aliAppId ?? '-'})` : (app.aliAppId ?? '-'),
      }));
  }

  function hasCompatibleOptions(capability: string): boolean {
    return appSelectOptions(capability).length > 0;
  }

  /** 选中应用的类型(用于行内标签展示) */
  function selectedAppType(capability: string): string | undefined {
    const appId = bindingMap.value[capability];
    return apps.value.find((app) => app.id === appId)?.appType;
  }

  function rowTypeTag(capability: string): { color: string; text: string } {
    const selected = selectedAppType(capability);
    if (selected) {
      return { color: appTypeColor(selected), text: appTypeLabel(selected) };
    }
    const required = requiredAppType(capability);
    if (required.length > 0) {
      return {
        color: 'default',
        // 需{type}
        text: $t('payment.merchant.alipayDirectApp.capabilityRequiredAppType', {
          type: required.map((t) => appTypeLabel(t)).join('/'),
        }),
      };
    }
    // 自动匹配
    return { color: 'default', text: $t('payment.merchant.alipayDirectApp.capabilityAutoTip') };
  }

  function clearIncompatibleBindings() {
    const next: Record<string, string | undefined> = { ...bindingMap.value };
    let cleared = false;
    capabilities.value.forEach((cap) => {
      const appId = next[cap.code];
      if (!appId) {
        return;
      }
      const app = apps.value.find((item) => item.id === appId);
      if (!isAlipayAppCompatible(app?.appType, cap.code)) {
        next[cap.code] = undefined;
        cleared = true;
      }
    });
    bindingMap.value = next;
    if (cleared) {
      // 已清除与支付方式不匹配的应用选择
      message.warning($t('payment.merchant.alipayDirectApp.appTypeCapabilityCleared'));
    }
  }

  /** 打开弹窗并加载数据 */
  function show(cMchNo: string) {
    channelMchNo.value = cMchNo;
    visible.value = true;
    loadData();
  }

  /** 并行加载能力候选、应用列表、当前绑定 */
  function loadData() {
    loading.value = true;
    Promise.all([
      AlipayDirectAppCapabilityApi.listSupportedCapabilities(),
      AlipayDirectAppApi.listByChannelMchNo(channelMchNo.value),
      AlipayDirectAppCapabilityApi.listByChannelMchNo(channelMchNo.value),
    ])
      .then(([capRes, appRes, bindRes]) => {
        capabilities.value = capRes.data ?? [];
        apps.value = appRes.data ?? [];
        const map: Record<string, string | undefined> = {};
        (bindRes.data ?? []).forEach((item) => {
          if (item.capability && item.alipayDirectAppId) {
            map[item.capability] = item.alipayDirectAppId;
          }
        });
        bindingMap.value = map;
        clearIncompatibleBindings();
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 保存绑定(全量覆盖) */
  function handleSave() {
    const items: AlipayDirectAppCapabilityItem[] = [];
    capabilities.value.forEach((cap) => {
      const appId = bindingMap.value[cap.code];
      if (appId) {
        items.push({ capability: cap.code, alipayDirectAppId: appId });
      }
    });
    loading.value = true;
    AlipayDirectAppCapabilityApi.saveBatch({
      channelMchNo: channelMchNo.value,
      items,
    })
      .then(() => {
        message.success($t('common.saveSuccess'));
        visible.value = false;
        emit('ok');
      })
      .finally(() => {
        loading.value = false;
      });
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.merchant.alipayDirectApp.capabilityTitle')"
    width="720px"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: !hasApps }"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <div class="mb-3 text-xs leading-relaxed text-muted-foreground">
        {{ $t('payment.merchant.alipayDirectApp.capabilityDesc') }}
      </div>

      <div v-if="!loading && !hasApps" class="mb-3">
        <a-alert type="warning" show-icon :message="$t('payment.merchant.alipayDirectApp.capabilityNoApp')" />
      </div>

      <div v-else class="capability-list">
        <div v-for="cap in capabilities" :key="cap.code" class="capability-row">
          <div class="capability-name">
            <span class="font-medium text-foreground">{{ cap.name }}</span>
            <span class="ml-1 text-xs text-muted-foreground">{{ cap.code }}</span>
          </div>
          <div class="capability-control">
            <a-tag :color="rowTypeTag(cap.code).color">
              {{ rowTypeTag(cap.code).text }}
            </a-tag>
            <a-select
              v-if="hasCompatibleOptions(cap.code) || requiredAppType(cap.code).length === 0"
              v-model:value="bindingMap[cap.code]"
              allow-clear
              :loading="loading"
              :placeholder="$t('payment.merchant.alipayDirectApp.capabilitySelectPlaceholder')"
              :options="appSelectOptions(cap.code)"
              class="w-52"
            />
            <span v-else class="w-52 text-xs text-muted-foreground">
              {{ $t('payment.merchant.alipayDirectApp.capabilityNoCompatibleApp') }}
            </span>
          </div>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<style scoped>
  .capability-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 60vh;
    padding: 4px;
    overflow-y: auto;
  }

  .capability-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .capability-name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .capability-control {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
  }
</style>

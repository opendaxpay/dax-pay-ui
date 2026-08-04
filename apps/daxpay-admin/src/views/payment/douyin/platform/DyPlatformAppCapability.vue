<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type DyCapabilityOption,
    DyPlatformAppCapabilityApi,
    type DyPlatformAppCapabilityItem,
  } from '#/api/payment/douyin/platform-app-capability.api';
  import { type DyPlatformApp, DyPlatformAppApi } from '#/api/payment/douyin/platform-app.api';
  import { useMessage } from '#/hooks/useMessage';

  import { isDyAppCompatible, resolveDyAppTypeByCapability } from '../shared/dy-app-type';

  defineOptions({ name: 'DyPlatformAppCapability' });

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();
  const visible = ref(false);
  const loading = ref(false);
  // 当前支付产品编码
  const product = ref('');
  // 支付能力候选列表（该产品白名单）
  const capabilities = ref<DyCapabilityOption[]>([]);
  // 全部平台应用
  const apps = ref<DyPlatformApp[]>([]);
  // 当前绑定：capability → dyPlatformAppId
  const bindingMap = ref<Record<string, string | undefined>>({});

  const hasApps = computed(() => apps.value.length > 0);

  /** 应用类型 → 展示标签 */
  function appTypeLabel(appType?: string): string {
    switch (appType) {
      case 'mini_program': {
        return $t('payment.douyin.app.appTypeMiniProgram');
      }
      case 'mobile_app': {
        return $t('payment.douyin.app.appTypeMobileApp');
      }
      case 'web_app': {
        return $t('payment.douyin.app.appTypeWebApp');
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
        return 'purple';
      }
      case 'web_app': {
        return 'green';
      }
      default: {
        return 'default';
      }
    }
  }

  /** 该能力所需应用类型 */
  function requiredAppType(capability: string): string[] {
    return resolveDyAppTypeByCapability(capability);
  }

  /** 与能力兼容的应用列表 */
  function compatibleApps(capability: string): DyPlatformApp[] {
    return apps.value.filter((app) => isDyAppCompatible(app.appType, capability));
  }

  /** 下拉选项：按能力过滤应用类型 */
  function appOptions(capability: string) {
    return compatibleApps(capability).map((app) => ({
      value: app.id!,
      label: app.appName ? `${app.appName} (${app.douyinAppId ?? '-'})` : (app.douyinAppId ?? '-'),
    }));
  }

  /** 选中应用的类型(用于行内标签展示) */
  function selectedAppType(capability: string): string | undefined {
    const appId = bindingMap.value[capability];
    return apps.value.find((app) => app.id === appId)?.appType;
  }

  /** 行内标签：已选类型，否则展示所需类型 */
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
        text: $t('payment.douyin.app.capabilityRequiredAppType', {
          type: required.map((t) => appTypeLabel(t)).join('/'),
        }),
      };
    }
    return { color: 'default', text: '-' };
  }

  /** 清除与能力不兼容的已选应用 */
  function clearIncompatibleBindings() {
    const next: Record<string, string | undefined> = { ...bindingMap.value };
    let cleared = false;
    capabilities.value.forEach((cap) => {
      const appId = next[cap.code];
      if (!appId) {
        return;
      }
      const app = apps.value.find((item) => item.id === appId);
      if (!isDyAppCompatible(app?.appType, cap.code)) {
        next[cap.code] = undefined;
        cleared = true;
      }
    });
    bindingMap.value = next;
    if (cleared) {
      message.warning($t('payment.douyin.app.appTypeCapabilityCleared'));
    }
  }

  /** 打开弹窗并加载该产品下的绑定 */
  function show(productCode: string) {
    product.value = productCode;
    visible.value = true;
    loadData();
  }

  /** 并行加载能力候选、应用列表、当前绑定 */
  function loadData() {
    loading.value = true;
    Promise.all([
      DyPlatformAppCapabilityApi.listSupportedCapabilities(product.value),
      DyPlatformAppApi.listAll(),
      DyPlatformAppCapabilityApi.listByProduct(product.value),
    ])
      .then(([capRes, appRes, bindRes]) => {
        capabilities.value = capRes.data ?? [];
        apps.value = appRes.data ?? [];
        const map: Record<string, string | undefined> = {};
        (bindRes.data ?? []).forEach((item) => {
          if (item.capability && item.dyPlatformAppId) {
            map[item.capability] = item.dyPlatformAppId;
          }
        });
        bindingMap.value = map;
        clearIncompatibleBindings();
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 保存绑定(按产品全量覆盖) */
  function handleSave() {
    const items: DyPlatformAppCapabilityItem[] = [];
    capabilities.value.forEach((cap) => {
      const appId = bindingMap.value[cap.code];
      if (appId) {
        items.push({ capability: cap.code, dyPlatformAppId: appId });
      }
    });
    loading.value = true;
    DyPlatformAppCapabilityApi.saveBatch({ product: product.value, items })
      .then(() => {
        message.success($t('payment.douyin.app.capabilitySaveSuccess'));
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
    :title="$t('payment.douyin.app.productCapabilityTitle')"
    width="640px"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: !hasApps }"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <div class="mb-3 text-xs leading-relaxed text-muted-foreground">
        {{ $t('payment.douyin.app.productCapabilityDesc') }}
      </div>

      <div v-if="!loading && !hasApps" class="mb-3">
        <a-alert type="warning" show-icon :message="$t('payment.douyin.app.capabilityNoApp')" />
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
              v-if="appOptions(cap.code).length > 0 || requiredAppType(cap.code).length === 0"
              v-model:value="bindingMap[cap.code]"
              allow-clear
              :loading="loading"
              :placeholder="$t('payment.douyin.app.capabilitySelectPlaceholder')"
              :options="appOptions(cap.code)"
              class="w-52"
            />
            <span v-else class="w-52 text-xs text-muted-foreground">
              {{ $t('payment.douyin.app.capabilityNoCompatibleApp') }}
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

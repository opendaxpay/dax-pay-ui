<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DyChannelAppCapabilityApi,
    type DyChannelAppCapabilityItem,
  } from '#/api/payment/douyin/channel-app-capability.api';
  import { type DyMchApp, DyMchAppApi } from '#/api/payment/douyin/mch-app.api';
  import {
    type DyCapabilityOption,
    DyPlatformAppCapabilityApi,
  } from '#/api/payment/douyin/platform-app-capability.api';
  import { useMessage } from '#/hooks/useMessage';

  import { isDyAppCompatible, resolveDyAppTypeByCapability } from '../shared/dy-app-type';

  defineOptions({ name: 'DyChannelAppCapability' });

  const emit = defineEmits<{ ok: [] }>();

  /** 特约「服务商默认」虚拟项（不落库） */
  const ISP_DEFAULT = '__ISP_DEFAULT__';

  const { message } = useMessage();
  const visible = ref(false);
  const loading = ref(false);
  const mchNo = ref('');
  const channelMchNo = ref('');
  // 支付产品编码
  const product = ref('');
  // isv = 特约；direct = 直连
  const mode = ref<'direct' | 'isv'>('direct');
  const capabilities = ref<DyCapabilityOption[]>([]);
  const mchApps = ref<DyMchApp[]>([]);
  // capability → merchant:{id} | __ISP_DEFAULT__ | undefined
  const bindingMap = ref<Record<string, string | undefined>>({});

  const isIsv = computed(() => mode.value === 'isv');
  const hasApps = computed(() => mchApps.value.length > 0 || isIsv.value);

  /** 编码商户应用 option */
  function encodeMerchantRef(id: string): string {
    return `merchant:${id}`;
  }

  /** 解码商户应用 option */
  function decodeMerchantRef(encoded?: string): null | string {
    if (!encoded || encoded === ISP_DEFAULT) {
      return null;
    }
    if (!encoded.startsWith('merchant:')) {
      return null;
    }
    const id = encoded.slice('merchant:'.length);
    return id || null;
  }

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

  function requiredAppType(capability: string): string[] {
    return resolveDyAppTypeByCapability(capability);
  }

  /** 下拉选项：特约含服务商默认；直连仅本商户应用 */
  function appSelectOptions(capability: string) {
    const options: Array<{ label: string; value: string }> = [];
    if (isIsv.value) {
      options.push({
        value: ISP_DEFAULT,
        // 服务商默认
        label: $t('payment.douyin.app.capabilityIspDefault'),
      });
    }
    mchApps.value
      .filter((app) => isDyAppCompatible(app.appType, capability))
      .forEach((app) => {
        options.push({
          value: encodeMerchantRef(app.id!),
          label: app.appName ? `${app.appName} (${app.douyinAppId ?? '-'})` : (app.douyinAppId ?? '-'),
        });
      });
    return options;
  }

  function hasCompatibleOptions(capability: string): boolean {
    return appSelectOptions(capability).length > 0;
  }

  function selectedAppType(capability: string): string | undefined {
    const val = bindingMap.value[capability];
    if (!val || val === ISP_DEFAULT) {
      return undefined;
    }
    const id = decodeMerchantRef(val);
    return mchApps.value.find((app) => app.id === id)?.appType;
  }

  function rowTypeTag(capability: string): { color: string; text: string } {
    const val = bindingMap.value[capability];
    if (val === ISP_DEFAULT) {
      return { color: 'default', text: $t('payment.douyin.app.capabilityIspDefault') };
    }
    const selected = selectedAppType(capability);
    if (selected) {
      return { color: appTypeColor(selected), text: appTypeLabel(selected) };
    }
    const required = requiredAppType(capability);
    if (required.length > 0) {
      return {
        color: 'default',
        text: $t('payment.douyin.app.capabilityRequiredAppType', {
          type: required.map((t) => appTypeLabel(t)).join('/'),
        }),
      };
    }
    return { color: 'default', text: '-' };
  }

  function clearIncompatibleBindings() {
    const next: Record<string, string | undefined> = { ...bindingMap.value };
    let cleared = false;
    capabilities.value.forEach((cap) => {
      const val = next[cap.code];
      if (!val || val === ISP_DEFAULT) {
        return;
      }
      const id = decodeMerchantRef(val);
      const app = mchApps.value.find((item) => item.id === id);
      if (!isDyAppCompatible(app?.appType, cap.code)) {
        next[cap.code] = isIsv.value ? ISP_DEFAULT : undefined;
        cleared = true;
      }
    });
    bindingMap.value = next;
    if (cleared) {
      message.warning($t('payment.douyin.app.appTypeCapabilityCleared'));
    }
  }

  /** 打开弹窗 */
  function show(no: string, cMchNo: string, productCode: string) {
    mchNo.value = no;
    channelMchNo.value = cMchNo;
    product.value = productCode;
    mode.value = productCode === 'douyin_isv' ? 'isv' : 'direct';
    visible.value = true;
    loadData();
  }

  function loadData() {
    loading.value = true;
    Promise.all([
      DyPlatformAppCapabilityApi.listSupportedCapabilities(product.value),
      DyMchAppApi.listByMchNo(mchNo.value),
      DyChannelAppCapabilityApi.listByChannelMchNo(channelMchNo.value),
    ])
      .then(([capRes, mchAppRes, bindRes]) => {
        capabilities.value = capRes.data ?? [];
        mchApps.value = mchAppRes.data ?? [];
        const map: Record<string, string | undefined> = {};
        (bindRes.data ?? []).forEach((item) => {
          if (!item.capability) {
            return;
          }
          // 仅认 merchant；platform 残留按方案 A 视为服务商默认/空
          if (item.appScope === 'merchant' && item.dyAppRefId) {
            map[item.capability] = encodeMerchantRef(item.dyAppRefId);
          }
        });
        capabilities.value.forEach((cap) => {
          if (!map[cap.code]) {
            map[cap.code] = isIsv.value ? ISP_DEFAULT : undefined;
          }
        });
        bindingMap.value = map;
        clearIncompatibleBindings();
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 保存：仅落 merchant；ISP_DEFAULT/空不写 */
  function handleSave() {
    const items: DyChannelAppCapabilityItem[] = [];
    capabilities.value.forEach((cap) => {
      const val = bindingMap.value[cap.code];
      const mchAppId = decodeMerchantRef(val);
      if (mchAppId) {
        items.push({
          capability: cap.code,
          appScope: 'merchant',
          dyAppRefId: mchAppId,
        });
      }
    });
    loading.value = true;
    DyChannelAppCapabilityApi.saveBatch({
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
      items,
    })
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
    :title="$t('payment.douyin.app.channelCapabilityTitle')"
    width="720px"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: !hasApps && !isIsv }"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <div class="mb-3 text-xs leading-relaxed text-muted-foreground">
        {{
          isIsv
            ? $t('payment.douyin.app.channelCapabilityDescIsv')
            : $t('payment.douyin.app.channelCapabilityDescDirect')
        }}
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
              v-if="hasCompatibleOptions(cap.code) || requiredAppType(cap.code).length === 0"
              v-model:value="bindingMap[cap.code]"
              :allow-clear="!isIsv"
              :loading="loading"
              :placeholder="$t('payment.douyin.app.capabilitySelectPlaceholder')"
              :options="appSelectOptions(cap.code)"
              class="w-64"
            />
            <span v-else class="w-64 text-xs text-muted-foreground">
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

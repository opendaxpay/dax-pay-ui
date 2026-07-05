<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type WechatIsvAppCapability,
    WechatIsvAppCapabilityApi,
  } from '#/api/payment/channel/wechat/isv-app-capability.api';
  import {
    type WechatCapabilityOption,
    WechatIsvMchAppCapabilityApi,
    type WechatIsvMchAppCapabilityItem,
  } from '#/api/payment/channel/wechat/isv-mch-app-capability.api';
  import { type WechatIsvMchApp, WechatIsvMchAppApi } from '#/api/payment/channel/wechat/isv-mch-app.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'WechatIsvMchAppCapability' });

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();

  // 虚拟选项值:代表"沿用服务商默认应用"(不落库,支付时回退全局服务商配置)
  const ISP_DEFAULT = '__ISP_DEFAULT__';

  const visible = ref(false);
  const loading = ref(false);
  const mchNo = ref('');
  const channelMchNo = ref('');
  // 支付能力候选列表
  const capabilities = ref<WechatCapabilityOption[]>([]);
  // 子商户自己的应用列表
  const apps = ref<WechatIsvMchApp[]>([]);
  // 全局服务商各能力绑定的应用(用于渲染第一项「服务商默认应用」)
  const ispDefaultMap = ref<Record<string, WechatIsvAppCapability>>({});
  // 当前绑定: capability → 选中值(ISP_DEFAULT 或 wechatIsvMchAppId)
  const bindingMap = ref<Record<string, string>>({});

  const hasMchApps = computed(() => apps.value.length > 0);

  /** 应用类型 → 展示标签 */
  function appTypeLabel(appType?: string): string {
    switch (appType) {
      case 'mini_program': {
        return $t('payment.channel.wechatManage.appTypeMiniProgram');
      }
      case 'mobile_app': {
        return $t('payment.channel.wechatManage.appTypeMobileApp');
      }
      case 'official_account': {
        return $t('payment.channel.wechatManage.appTypeOfficialAccount');
      }
      default: {
        return appType ?? '-';
      }
    }
  }

  /** 服务商默认应用展示文案(根据全局配置动态填充) */
  function ispDefaultLabel(capability: string): string {
    const ispApp = ispDefaultMap.value[capability];
    if (ispApp && ispApp.appName) {
      return `${$t('payment.channel.wechatManage.capabilityIspDefault')} · ${ispApp.appName} (${ispApp.wxAppId ?? '-'})`;
    }
    return `${$t('payment.channel.wechatManage.capabilityIspDefault')} · ${$t('payment.channel.wechatManage.capabilityIspNotConfigured')}`;
  }

  /** 服务商默认应用的应用类型(用于行内标签展示) */
  function ispDefaultAppType(capability: string): string | undefined {
    return ispDefaultMap.value[capability]?.appType;
  }

  /** 选中值对应的应用类型(用于行内标签) */
  function selectedAppType(capability: string): string | undefined {
    const val = bindingMap.value[capability];
    if (val === ISP_DEFAULT || !val) {
      return ispDefaultAppType(capability);
    }
    return apps.value.find((app) => app.id === val)?.appType;
  }

  /** 下拉选项: 第一项服务商默认(固定), 其余子商户应用 */
  function appOptions(capability: string) {
    return [
      { value: ISP_DEFAULT, label: ispDefaultLabel(capability) },
      ...apps.value.map((app) => ({
        value: app.id!,
        label: app.appName ? `${app.appName} (${app.wxAppId ?? '-'})` : (app.wxAppId ?? '-'),
      })),
    ];
  }

  /** 打开弹窗并加载数据 */
  function show(no: string, cMchNo: string) {
    mchNo.value = no;
    channelMchNo.value = cMchNo;
    visible.value = true;
    loadData();
  }

  /** 并行加载能力候选、子商户应用、当前绑定、全局服务商绑定 */
  function loadData() {
    loading.value = true;
    Promise.all([
      WechatIsvMchAppCapabilityApi.listSupportedCapabilities(),
      WechatIsvMchAppApi.listByChannelMchNo(mchNo.value, channelMchNo.value),
      WechatIsvMchAppCapabilityApi.listByChannelMchNo(mchNo.value, channelMchNo.value),
      WechatIsvAppCapabilityApi.listAll(),
    ])
      .then(([capRes, appRes, bindRes, ispRes]) => {
        capabilities.value = capRes.data ?? [];
        apps.value = appRes.data ?? [];
        // 全局服务商能力 → 应用映射
        const ispMap: Record<string, WechatIsvAppCapability> = {};
        (ispRes.data ?? []).forEach((item) => {
          if (item.capability) {
            ispMap[item.capability] = item;
          }
        });
        ispDefaultMap.value = ispMap;
        // 当前绑定: 子商户已配的用 wechatIsvMchAppId, 未配的默认 ISP_DEFAULT(服务商默认)
        const map: Record<string, string> = {};
        (bindRes.data ?? []).forEach((item) => {
          if (item.capability && item.wechatIsvMchAppId) {
            map[item.capability] = item.wechatIsvMchAppId;
          }
        });
        capabilities.value.forEach((cap) => {
          if (!map[cap.code]) {
            map[cap.code] = ISP_DEFAULT;
          }
        });
        bindingMap.value = map;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 保存绑定(选了子商户应用的才提交, ISP_DEFAULT 不落库→自动回退全局) */
  function handleSave() {
    const items: WechatIsvMchAppCapabilityItem[] = [];
    capabilities.value.forEach((cap) => {
      const val = bindingMap.value[cap.code];
      if (val && val !== ISP_DEFAULT) {
        items.push({ capability: cap.code, wechatIsvMchAppId: val });
      }
    });
    loading.value = true;
    WechatIsvMchAppCapabilityApi.saveBatch({
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
      items,
    })
      .then(() => {
        message.success($t('payment.channel.wechatManage.capabilitySaveSuccess'));
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
    :title="$t('payment.channel.wechatManage.capabilityTitle')"
    width="640px"
    :confirm-loading="loading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <div class="mb-3 text-xs leading-relaxed text-muted-foreground">
        {{ $t('payment.channel.wechatManage.capabilityDescIsv') }}
      </div>

      <a-alert
        v-if="!loading && !hasMchApps"
        type="info"
        show-icon
        class="mb-3"
        :message="$t('payment.channel.wechatManage.capabilityNoMchAppTip')"
      />

      <div class="capability-list">
        <div v-for="cap in capabilities" :key="cap.code" class="capability-row">
          <div class="capability-name">
            <span class="font-medium text-foreground">{{ cap.name }}</span>
            <span class="ml-1 text-xs text-muted-foreground">{{ cap.code }}</span>
          </div>
          <div class="capability-control">
            <a-tag v-if="selectedAppType(cap.code)" color="blue">
              {{ appTypeLabel(selectedAppType(cap.code)) }}
            </a-tag>
            <a-select
              v-model:value="bindingMap[cap.code]"
              :loading="loading"
              :options="appOptions(cap.code)"
              class="w-60"
            />
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

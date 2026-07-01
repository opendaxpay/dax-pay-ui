<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    WechatMchAppCapabilityApi,
    type WechatCapabilityOption,
    type WechatMchAppCapabilityItem,
  } from '#/api/payment/channel/wechat/mch-app-capability.api';
  import { WechatMchAppApi, type WechatMchApp } from '#/api/payment/channel/wechat/mch-app.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'WechatMchAppCapability' });

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();
  const visible = ref(false);
  const loading = ref(false);
  const mchNo = ref('');
  const channelMchNo = ref('');
  // 支付能力候选列表
  const capabilities = ref<WechatCapabilityOption[]>([]);
  // 通道商户下全部应用
  const apps = ref<WechatMchApp[]>([]);
  // 当前绑定：capability → wechatDirectAppId
  const bindingMap = ref<Record<string, string>>({});

  const hasApps = computed(() => apps.value.length > 0);

  /** 应用类型 → 展示标签 */
  const appTypeLabel = (appType?: string): string => {
    switch (appType) {
      case 'official_account': {
        return $t('payment.channel.wechatManage.appTypeOfficialAccount');
      }
      case 'mini_program': {
        return $t('payment.channel.wechatManage.appTypeMiniProgram');
      }
      case 'mobile_app': {
        return $t('payment.channel.wechatManage.appTypeMobileApp');
      }
      default: {
        return appType ?? '-';
      }
    }
  };

  /** 应用类型 → 标签颜色 */
  function appTypeColor(appType?: string): string {
    switch (appType) {
      case 'official_account': {
        return 'green';
      }
      case 'mini_program': {
        return 'blue';
      }
      case 'mobile_app': {
        return 'purple';
      }
      default: {
        return 'default';
      }
    }
  }

  /** 下拉选项：应用列表 */
  const appOptions = computed(() =>
    apps.value.map((app) => ({
      value: app.id!,
      label: app.appName ? `${app.appName} (${app.wxAppId ?? '-'})` : (app.wxAppId ?? '-'),
    })),
  );

  /** 选中应用的类型(用于行内标签展示) */
  function selectedAppType(capability: string): string | undefined {
    const appId = bindingMap.value[capability];
    return apps.value.find((app) => app.id === appId)?.appType;
  }

  /** 打开弹窗并加载数据 */
  function show(no: string, cMchNo: string) {
    mchNo.value = no;
    channelMchNo.value = cMchNo;
    visible.value = true;
    loadData();
  }

  /** 并行加载能力候选、应用列表、当前绑定 */
  function loadData() {
    loading.value = true;
    Promise.all([
      WechatMchAppCapabilityApi.listSupportedCapabilities(),
      WechatMchAppApi.listByChannelMchNo(mchNo.value, channelMchNo.value),
      WechatMchAppCapabilityApi.listByChannelMchNo(mchNo.value, channelMchNo.value),
    ])
      .then(([capRes, appRes, bindRes]) => {
        capabilities.value = capRes.data ?? [];
        apps.value = appRes.data ?? [];
        const map: Record<string, string> = {};
        (bindRes.data ?? []).forEach((item) => {
          if (item.capability && item.wechatDirectAppId) {
            map[item.capability] = item.wechatDirectAppId;
          }
        });
        bindingMap.value = map;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 保存绑定(全量覆盖) */
  function handleSave() {
    const items: WechatMchAppCapabilityItem[] = [];
    capabilities.value.forEach((cap) => {
      const appId = bindingMap.value[cap.code];
      if (appId) {
        items.push({ capability: cap.code, wechatDirectAppId: appId });
      }
    });
    loading.value = true;
    WechatMchAppCapabilityApi.saveBatch({
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
    :ok-button-props="{ disabled: !hasApps }"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <div class="mb-3 text-xs leading-relaxed text-muted-foreground">
        {{ $t('payment.channel.wechatManage.capabilityDesc') }}
      </div>

      <a-alert
        v-if="!loading && !hasApps"
        type="warning"
        show-icon
        class="mb-3"
        :message="$t('payment.channel.wechatManage.capabilityNoApp')"
      />

      <div v-else class="capability-list">
        <div
          v-for="cap in capabilities"
          :key="cap.code"
          class="capability-row"
        >
          <div class="capability-name">
            <span class="font-medium text-foreground">{{ cap.name }}</span>
            <span class="ml-1 text-xs text-muted-foreground">{{ cap.code }}</span>
          </div>
          <div class="capability-control">
            <a-tag
              v-if="selectedAppType(cap.code)"
              :color="appTypeColor(selectedAppType(cap.code))"
            >
              {{ appTypeLabel(selectedAppType(cap.code)) }}
            </a-tag>
            <a-tag v-else color="default">
              {{ $t('payment.channel.wechatManage.capabilityAutoTip') }}
            </a-tag>
            <a-select
              v-model:value="bindingMap[cap.code]"
              allow-clear
              :loading="loading"
              :placeholder="$t('payment.channel.wechatManage.capabilitySelectPlaceholder')"
              :options="appOptions"
              class="w-52"
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

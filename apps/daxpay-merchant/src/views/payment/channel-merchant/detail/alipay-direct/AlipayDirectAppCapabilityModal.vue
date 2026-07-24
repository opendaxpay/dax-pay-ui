<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayDirectAppCapabilityApi,
    type AlipayDirectAppCapabilityItem,
    type AlipayDirectCapabilityOption,
  } from '#/api/payment/alipay/alipay-direct-app-capability.api';
  import { AlipayDirectAppApi, type AlipayDirectAppResult } from '#/api/payment/alipay/alipay-direct-app.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayDirectAppCapabilityModal' });

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();
  const visible = ref(false);
  const loading = ref(false);
  const channelMchNo = ref('');
  const capabilities = ref<AlipayDirectCapabilityOption[]>([]);
  const apps = ref<AlipayDirectAppResult[]>([]);
  // capability → alipayDirectAppId
  const bindingMap = ref<Record<string, string | undefined>>({});

  function show(cMchNo: string) {
    channelMchNo.value = cMchNo;
    visible.value = true;
    loadData();
  }

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
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function appSelectOptions() {
    return apps.value.map((app) => ({
      label: app.appName ? `${app.appName} (${app.aliAppId ?? '-'})` : (app.aliAppId ?? '-'),
      value: app.id!,
    }));
  }

  function handleSave() {
    const items: AlipayDirectAppCapabilityItem[] = [];
    Object.entries(bindingMap.value).forEach(([cap, appId]) => {
      if (appId) {
        items.push({ capability: cap, alipayDirectAppId: appId });
      }
    });
    loading.value = true;
    AlipayDirectAppCapabilityApi.saveBatch({
      channelMchNo: channelMchNo.value,
      items,
    })
      .then(() => {
        // 能力绑定保存成功
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
    :ok-button-props="{ disabled: apps.length === 0 }"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <!-- 无应用提示 -->
      <div v-if="!loading && apps.length === 0" class="mb-3">
        <a-alert type="warning" show-icon :message="$t('payment.merchant.alipayDirectApp.capabilityNoApp')" />
      </div>

      <div v-else class="capability-list">
        <div v-for="cap in capabilities" :key="cap.code" class="capability-row">
          <div class="capability-name">
            <span class="font-medium text-foreground">{{ cap.name }}</span>
            <span class="ml-1 text-xs text-muted-foreground">{{ cap.code }}</span>
          </div>
          <a-select
            v-model:value="bindingMap[cap.code]"
            allow-clear
            :loading="loading"
            :placeholder="$t('payment.merchant.alipayDirectApp.capabilitySelectPlaceholder')"
            :options="appSelectOptions()"
            class="w-64"
          />
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
</style>

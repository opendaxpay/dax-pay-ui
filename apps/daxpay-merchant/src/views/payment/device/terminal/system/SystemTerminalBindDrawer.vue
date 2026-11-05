<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type ChannelTerminalResult,
    TerminalDeviceApi,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';

  const visible = ref(false);
  const loading = ref(false);
  const current = ref<null | TerminalDeviceResult>(null);
  const boundList = ref<ChannelTerminalResult[]>([]);

  const title = computed(() => {
    if (!current.value) {
      return $t('payment.device.terminal.bindManage');
    }
    return `${$t('payment.device.terminal.bindManage')} - ${current.value.terminalNo}`;
  });

  /** 打开绑定抽屉(只读查看已绑定通道终端) */
  async function show(row: TerminalDeviceResult) {
    current.value = row;
    visible.value = true;
    await refresh();
  }

  /** 刷新已绑定通道终端列表 */
  async function refresh() {
    if (!current.value?.terminalNo) {
      return;
    }
    loading.value = true;
    try {
      const boundRes = await TerminalDeviceApi.boundChannelList(current.value.terminalNo);
      boundList.value = boundRes.data || [];
    } finally {
      loading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer v-model:open="visible" :title="title" :default-size="640" :destroy-on-hidden="true">
    <a-spin :spinning="loading">
      <div class="mb-4">
        <!-- 只读提示: 绑定关系在通道终端登记时建立与维护 -->
        <a-alert type="info" show-icon :message="$t('payment.device.terminal.bindReadOnlyTip')" />
      </div>

      <div class="mb-2 font-medium">{{ $t('payment.device.terminal.boundChannel') }}</div>
      <a-empty v-if="boundList.length === 0" :description="$t('payment.device.terminal.noBound')" />
      <div v-else class="space-y-3">
        <div
          v-for="(item, index) in boundList"
          :key="item.id || index"
          class="flex items-center justify-between border-b border-border py-3 last:border-0"
        >
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ item.name }}</div>
            <div class="truncate text-sm text-gray-500">
              {{ `${item.channelMchNo || '-'} · ${item.type || '-'} · ${item.outTerminalNo || '-'}` }}
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

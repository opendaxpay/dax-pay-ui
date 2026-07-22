<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    TerminalDeviceApi,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const visible = ref(false);
  const loading = ref(false);
  const current = ref<null | TerminalDeviceResult>(null);
  const boundList = ref<ChannelTerminalResult[]>([]);
  const candidateList = ref<ChannelTerminalResult[]>([]);
  const selectedChannelId = ref<string | undefined>();

  const title = computed(() => {
    if (!current.value) {
      return $t('payment.device.terminal.bindManage');
    }
    return `${$t('payment.device.terminal.bindManage')} - ${current.value.terminalNo}`;
  });

  /**
   * 打开绑定抽屉
   */
  async function show(row: TerminalDeviceResult) {
    current.value = row;
    selectedChannelId.value = undefined;
    visible.value = true;
    await refresh();
  }

  /**
   * 刷新已绑定与候选列表
   */
  async function refresh() {
    if (!current.value?.terminalNo || !current.value.mchNo) {
      return;
    }
    loading.value = true;
    try {
      const [boundRes, allRes] = await Promise.all([
        TerminalDeviceApi.boundChannelList(current.value.terminalNo),
        ChannelTerminalApi.listByMchNo(current.value.mchNo),
      ]);
      boundList.value = boundRes.data || [];
      const boundIds = new Set(boundList.value.map((i) => i.id));
      candidateList.value = (allRes.data || []).filter((i) => !boundIds.has(i.id));
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加绑定
   */
  async function handleBind() {
    if (!selectedChannelId.value || !current.value?.terminalNo) {
      message.warning($t('payment.device.terminal.pleaseSelectChannelTerminal'));
      return;
    }
    await TerminalDeviceApi.bind({
      systemTerminalNo: current.value.terminalNo,
      channelTerminalId: selectedChannelId.value,
    });
    message.success($t('common.operationSuccess'));
    selectedChannelId.value = undefined;
    await refresh();
  }

  /**
   * 解绑
   */
  function handleUnbind(row: ChannelTerminalResult) {
    if (!current.value?.terminalNo || !row.id) {
      return;
    }
    confirm({
      // 确定解除绑定吗？
      content: $t('payment.device.terminal.confirmUnbind'),
      onOk() {
        return TerminalDeviceApi.unbind({
          systemTerminalNo: current.value!.terminalNo!,
          channelTerminalId: row.id!,
        }).then(async () => {
          message.success($t('common.operationSuccess'));
          await refresh();
        });
      },
    });
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer v-model:open="visible" :title="title" :size="640" :destroy-on-hidden="true">
    <a-spin :spinning="loading">
      <div v-if="hasPermission(PermCodes.Merchant.Terminal.MANAGE)" class="mb-4 flex gap-2">
        <a-select
          v-model:value="selectedChannelId"
          class="flex-1"
          :placeholder="$t('payment.device.terminal.pleaseSelectChannelTerminal')"
          :options="
            candidateList.map((i) => ({
              label: `${i.name || '-'} / ${i.channelMchNo || '-'} / ${i.type || '-'}`,
              value: i.id,
            }))
          "
          show-search
          option-filter-prop="label"
          allow-clear
        />
        <a-button type="primary" @click="handleBind">{{ $t('payment.device.terminal.addBind') }}</a-button>
      </div>

      <div class="mb-2 font-medium">{{ $t('payment.device.terminal.boundChannel') }}</div>
      <a-empty v-if="boundList.length === 0" :description="$t('payment.device.terminal.noBound')" />
      <div v-else class="space-y-3">
        <div
          v-for="(item, index) in boundList"
          :key="item.id || index"
          class="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
        >
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ item.name }}</div>
            <div class="truncate text-sm text-gray-500">
              {{ `${item.channelMchNo || '-'} · ${item.type || '-'} · ${item.outTerminalNo || '-'}` }}
            </div>
          </div>
          <a-button
            v-if="hasPermission(PermCodes.Merchant.Terminal.MANAGE)"
            type="link"
            size="small"
            danger
            @click="handleUnbind(item)"
          >
            {{ $t('payment.device.terminal.unbind') }}
          </a-button>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

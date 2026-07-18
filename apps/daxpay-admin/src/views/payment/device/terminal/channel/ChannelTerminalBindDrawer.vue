<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    TerminalDeviceApi,
    type ChannelTerminalResult,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const visible = ref(false);
  const loading = ref(false);
  const current = ref<ChannelTerminalResult | null>(null);
  const boundList = ref<TerminalDeviceResult[]>([]);
  const candidateList = ref<TerminalDeviceResult[]>([]);
  const selectedTerminalNo = ref<string | undefined>();

  const title = computed(() => {
    if (!current.value) {
      return $t('payment.device.terminal.bindManage');
    }
    return `${$t('payment.device.terminal.bindManage')} - ${current.value.name || current.value.id}`;
  });

  /**
   * 打开绑定抽屉
   */
  async function show(row: ChannelTerminalResult) {
    current.value = row;
    selectedTerminalNo.value = undefined;
    visible.value = true;
    await refresh();
  }

  /**
   * 刷新绑定列表
   */
  async function refresh() {
    if (!current.value?.id || !current.value.mchNo) {
      return;
    }
    loading.value = true;
    try {
      const [boundRes, allRes] = await Promise.all([
        ChannelTerminalApi.boundSystemList(current.value.id),
        TerminalDeviceApi.listByMchNo(current.value.mchNo),
      ]);
      boundList.value = boundRes.data || [];
      const boundNos = new Set(boundList.value.map((i) => i.terminalNo));
      candidateList.value = (allRes.data || []).filter((i) => !boundNos.has(i.terminalNo));
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加绑定
   */
  async function handleBind() {
    if (!selectedTerminalNo.value || !current.value?.id) {
      message.warning($t('payment.device.terminal.pleaseSelectTerminal'));
      return;
    }
    await ChannelTerminalApi.bind({
      systemTerminalNo: selectedTerminalNo.value,
      channelTerminalId: current.value.id,
    });
    message.success($t('common.operationSuccess'));
    selectedTerminalNo.value = undefined;
    await refresh();
  }

  /**
   * 解绑
   */
  function handleUnbind(row: TerminalDeviceResult) {
    if (!current.value?.id || !row.terminalNo) {
      return;
    }
    confirm({
      content: $t('payment.device.terminal.confirmUnbind'),
      onOk() {
        return ChannelTerminalApi.unbind({
          systemTerminalNo: row.terminalNo!,
          channelTerminalId: current.value!.id!,
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
  <a-drawer v-model:open="visible" :title="title" :width="640" :destroy-on-close="true">
    <a-spin :spinning="loading">
      <div v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)" class="mb-4 flex gap-2">
        <a-select
          v-model:value="selectedTerminalNo"
          class="flex-1"
          :placeholder="$t('payment.device.terminal.pleaseSelectTerminal')"
          :options="
            candidateList.map((i) => ({
              label: `${i.name || '-'} (${i.terminalNo})`,
              value: i.terminalNo,
            }))
          "
          show-search
          option-filter-prop="label"
          allow-clear
        />
        <a-button type="primary" @click="handleBind">{{ $t('payment.device.terminal.addBind') }}</a-button>
      </div>

      <div class="mb-2 font-medium">{{ $t('payment.device.terminal.boundSystem') }}</div>
      <a-empty v-if="boundList.length === 0" :description="$t('payment.device.terminal.noBound')" />
      <a-list v-else :data-source="boundList" bordered>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta :title="item.name" :description="item.terminalNo" />
            <template #actions>
              <a-button
                v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
                type="link"
                size="small"
                danger
                @click="handleUnbind(item)"
              >
                {{ $t('payment.device.terminal.unbind') }}
              </a-button>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>
  </a-drawer>
</template>

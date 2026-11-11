<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type ChannelTerminalResult, TerminalDeviceApi } from '#/api/payment/device/terminal.api';
  // 通道终端状态 → 标签颜色(与 plus / 运营端共用同一份常量)
  import { channelNameMap, channelTerminalStatusColorMap as statusColorMap } from '#/enums/payment';

  /**
   * 商户终端关联通道终端抽屉(商户端, 只读)
   *
   * 关联关系由运营端在通道终端报备时建立, 商户端不提供新增/报备/解绑等写操作;
   * 本抽屉供商户终端列表与通道商户终端台账复用。
   */
  defineOptions({ name: 'TerminalChannelDrawer' });

  const visible = ref(false);
  const loading = ref(false);
  const terminalNo = ref('');
  const terminalName = ref('');
  const rows = ref<ChannelTerminalResult[]>([]);

  const title = computed(() => {
    // 关联通道终端 · 商户终端名称(无名称时退化为终端编码)
    return `${$t('payment.device.terminal.relatedChannelTitle')} · ${terminalName.value || terminalNo.value}`;
  });

  /**
   * 打开抽屉并加载该商户终端已关联的通道终端
   */
  async function show(payload: { name?: string; terminalNo: string }) {
    terminalNo.value = payload.terminalNo;
    terminalName.value = payload.name || '';
    rows.value = [];
    visible.value = true;
    await load();
  }

  /** 加载已关联通道终端(后端按登录商户上下文强制隔离) */
  async function load() {
    if (!terminalNo.value) {
      rows.value = [];
      return;
    }
    loading.value = true;
    try {
      const { data } = await TerminalDeviceApi.boundChannelList(terminalNo.value);
      rows.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  /** 通道名称(未知通道回退原始编码) */
  function channelLabel(channel?: string) {
    if (!channel) {
      return '-';
    }
    return channelNameMap[channel] || channel;
  }

  /** 报送类型文案 */
  function typeLabel(type?: string) {
    if (!type) {
      return '-';
    }
    return $t(`dict.terminal_type.${type}`);
  }

  /** 状态文案 */
  function statusLabel(status?: string) {
    if (!status) {
      return '-';
    }
    return $t(`dict.channel_terminal_status.${status}`);
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="title"
    :default-size="920"
    :destroy-on-hidden="true"
  >
    <div class="mb-4">
      <!-- 只读提示: 关联关系由运营端在通道终端报备时建立 -->
      <a-alert type="info" show-icon :message="$t('payment.device.terminal.relatedChannelTip')" />
    </div>
    <a-empty v-if="!loading && rows.length === 0" :description="$t('payment.device.terminal.noBound')" />
    <vxe-table v-else :row-config="{ keyField: 'id' }" :data="rows" :loading="loading">
      <vxe-column field="channel" :title="$t('payment.device.terminal.field.channel')" :min-width="140">
        <template #default="{ row }">
          {{ channelLabel(row.channel) }}
        </template>
      </vxe-column>
      <vxe-column
        field="channelMchNo"
        :title="$t('payment.device.terminal.field.channelMchNo')"
        :min-width="160"
        show-overflow
      />
      <vxe-column field="type" :title="$t('payment.device.terminal.field.type')" :min-width="120">
        <template #default="{ row }">
          {{ typeLabel(row.type) }}
        </template>
      </vxe-column>
      <vxe-column
        field="outTerminalNo"
        :title="$t('payment.device.terminal.field.outTerminalNo')"
        :min-width="160"
        show-overflow
      >
        <template #default="{ row }">
          {{ row.outTerminalNo || '-' }}
        </template>
      </vxe-column>
      <vxe-column field="status" :title="$t('payment.device.terminal.field.status')" :min-width="100" align="center">
        <template #default="{ row }">
          <a-tag :color="statusColorMap[row.status] || 'default'">
            {{ statusLabel(row.status) }}
          </a-tag>
        </template>
      </vxe-column>
      <vxe-column field="errorMsg" :title="$t('payment.device.terminal.field.errorMsg')" :min-width="180" show-overflow>
        <template #default="{ row }">
          <span :class="row.errorMsg ? 'text-red-500' : 'text-muted-foreground'" :title="row.errorMsg || ''">
            {{ row.errorMsg || '-' }}
          </span>
        </template>
      </vxe-column>
      <vxe-column
        field="createTime"
        :title="$t('payment.device.terminal.field.createTime')"
        :min-width="180"
        formatter="formatDateTime"
      />
    </vxe-table>
  </a-drawer>
</template>

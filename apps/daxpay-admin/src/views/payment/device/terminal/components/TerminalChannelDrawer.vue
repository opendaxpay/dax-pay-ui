<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type ChannelTerminalResult, TerminalDeviceApi } from '#/api/payment/device/terminal.api';
  import { channelI18nMap, channelNameMap, channelTerminalStatusColorMap } from '#/enums/payment/channelEnum';

  defineOptions({ name: 'TerminalChannelDrawer' });

  const visible = ref(false);
  const loading = ref(false);
  // 当前商户终端(名称用于标题展示, 终端编码用于查询关联通道终端)
  const current = ref<null | { name?: string; terminalNo: string }>(null);
  const tableData = ref<ChannelTerminalResult[]>([]);

  const title = computed(() => {
    const label = current.value?.name || current.value?.terminalNo || '-';
    // 关联通道终端 · {终端名称/终端编码}
    return `${$t('payment.device.terminal.relatedChannelTitle')} · ${label}`;
  });

  /**
   * 通道展示名(优先国际化词条, 缺映射回退中文名/原编码)
   */
  function channelLabel(code?: string): string {
    if (!code) {
      return '-';
    }
    const i18nKey = channelI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) {
        return text;
      }
    }
    return channelNameMap[code] ?? code;
  }

  /**
   * 报送类型文案
   */
  function typeLabel(type?: string) {
    if (!type) {
      return '-';
    }
    return $t(`dict.terminal_type.${type}`);
  }

  /**
   * 报备状态文案
   */
  function statusLabel(status?: string) {
    if (!status) {
      return '-';
    }
    return $t(`dict.channel_terminal_status.${status}`);
  }

  /**
   * 打开抽屉(纯只读: 关联关系由通道终端报备时建立, 本抽屉不承载任何写操作)
   */
  async function show(row: { name?: string; terminalNo: string }) {
    current.value = row;
    tableData.value = [];
    visible.value = true;
    if (!row.terminalNo) {
      return;
    }
    loading.value = true;
    try {
      const res = await TerminalDeviceApi.boundChannelList(row.terminalNo);
      tableData.value = res.data || [];
    } finally {
      loading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer v-model:open="visible" :title="title" :default-size="920" :destroy-on-hidden="true">
    <!-- 只读提示: 关联关系由通道终端报备时建立(报备即绑定), 此处仅查看 -->
    <div class="mb-3 text-xs leading-relaxed text-muted-foreground">
      {{ $t('payment.device.terminal.relatedChannelTip') }}
    </div>

    <a-spin :spinning="loading">
      <a-empty v-if="tableData.length === 0" :description="$t('payment.device.terminal.noBound')" />
      <vxe-table v-else :row-config="{ keyField: 'id' }" :data="tableData">
        <vxe-column field="channel" :title="$t('payment.device.terminal.field.channel')" :min-width="110">
          <template #default="{ row }">
            {{ channelLabel(row.channel) }}
          </template>
        </vxe-column>
        <vxe-column
          field="channelMchNo"
          :title="$t('payment.device.terminal.field.channelMchNo')"
          :min-width="180"
          show-overflow
        />
        <vxe-column field="type" :title="$t('payment.device.terminal.field.type')" :min-width="120" align="center">
          <template #default="{ row }">
            {{ typeLabel(row.type) }}
          </template>
        </vxe-column>
        <vxe-column
          field="outTerminalNo"
          :title="$t('payment.device.terminal.field.outTerminalNo')"
          :min-width="170"
          show-overflow
        >
          <template #default="{ row }">
            <span v-if="row.outTerminalNo">{{ row.outTerminalNo }}</span>
            <span v-else style="color: var(--text-color-placeholder)">-</span>
          </template>
        </vxe-column>
        <vxe-column field="status" :title="$t('payment.device.terminal.field.status')" :min-width="100" align="center">
          <template #default="{ row }">
            <a-tag :color="channelTerminalStatusColorMap[row.status] || 'default'">
              {{ statusLabel(row.status) }}
            </a-tag>
          </template>
        </vxe-column>
        <vxe-column
          field="errorMsg"
          :title="$t('payment.device.terminal.field.errorMsg')"
          :min-width="180"
          show-overflow
        >
          <template #default="{ row }">
            <span v-if="row.errorMsg" class="text-red-500">{{ row.errorMsg }}</span>
            <span v-else style="color: var(--text-color-placeholder)">-</span>
          </template>
        </vxe-column>
        <vxe-column
          field="createTime"
          :title="$t('payment.device.terminal.field.createTime')"
          :min-width="170"
          formatter="formatDateTime"
        />
      </vxe-table>
    </a-spin>
  </a-drawer>
</template>

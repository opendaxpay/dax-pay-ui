<script lang="ts" setup>
  import type { CallbackRecord } from '#/api/demo/callback-demo.api';

  import { computed, onUnmounted, ref } from 'vue';

  import { Page } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { CallbackDemoApi } from '#/api/demo/callback-demo.api';
  import { useMessage } from '#/hooks/useMessage';

  const { confirm, message } = useMessage();

  // 接收记录列表
  const records = ref<CallbackRecord[]>([]);
  // 轮询定时器
  let pollTimer: null | ReturnType<typeof setInterval> = null;

  /**
   * 拉取最新的接收记录
   */
  async function refreshRecords() {
    const { data } = await CallbackDemoApi.list();
    records.value = data ?? [];
  }

  /**
   * 清空接收记录（带二次确认）
   */
  function clearRecords() {
    confirm({
      title: $t('demos.callback.messages.clearConfirm'),
      onOk: async () => {
        await CallbackDemoApi.clear();
        message.success($t('demos.callback.messages.clearSuccess'));
        await refreshRecords();
      },
    });
  }

  // 表格列定义（响应语言切换）
  const columns = computed(() => [
    {
      title: $t('demos.callback.records.columns.bizType'),
      dataIndex: 'bizType',
      width: 90,
    },
    {
      title: $t('demos.callback.records.columns.event'),
      dataIndex: 'event',
      width: 130,
    },
    {
      title: $t('demos.callback.records.columns.mchNo'),
      dataIndex: 'mchNo',
      width: 150,
    },
    {
      title: $t('demos.callback.records.columns.appId'),
      dataIndex: 'appId',
      width: 150,
    },
    {
      title: $t('demos.callback.records.columns.bizNo'),
      dataIndex: 'bizNo',
      width: 190,
    },
    {
      title: $t('demos.callback.records.columns.amount'),
      dataIndex: 'amount',
      width: 100,
    },
    {
      title: $t('demos.callback.records.columns.verifyResult'),
      dataIndex: 'verifyResult',
      width: 90,
    },
    {
      title: $t('demos.callback.records.columns.receiveTime'),
      dataIndex: 'receiveTime',
      width: 180,
    },
  ]);

  // 业务类型标签颜色映射
  const bizTypeColorMap: Record<string, string> = {
    pay: 'green',
    refund: 'orange',
    unknown: 'default',
  };

  // 组件挂载后立即拉取一次并启动轮询
  refreshRecords();
  pollTimer = setInterval(refreshRecords, 2000);

  // 组件卸载时清理定时器，避免内存泄漏
  onUnmounted(() => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  });
</script>

<template>
  <Page :description="$t('demos.callback.description')" :title="$t('demos.callback.title')">
    <!-- 联调配置说明 -->
    <div class="mb-4">
      <a-alert :message="$t('demos.callback.guide.title')" type="info" show-icon>
        <template #description>
          <div class="text-xs">
            <p class="mb-1">{{ $t('demos.callback.guide.usage') }}</p>
            <p class="mb-1">
              {{ $t('demos.callback.guide.notifyUrlLabel') }}
              <a-typography-text code copyable>/test/callback/pay</a-typography-text>
            </p>
            <p>{{ $t('demos.callback.guide.note') }}</p>
          </div>
        </template>
      </a-alert>
    </div>

    <!-- 接收记录 -->
    <a-card>
      <template #title>
        <div class="flex items-center gap-2">
          <span>{{ $t('demos.callback.records.title') }}</span>
          <a-tag color="processing">2s</a-tag>
        </div>
      </template>
      <template #extra>
        <a-space>
          <a-button size="small" @click="refreshRecords">
            {{ $t('demos.callback.records.refresh') }}
          </a-button>
          <a-button danger size="small" @click="clearRecords">
            {{ $t('demos.callback.records.clear') }}
          </a-button>
        </a-space>
      </template>

      <p class="mb-3 text-gray-400 text-xs">
        {{ $t('demos.callback.records.description') }}
      </p>

      <a-table
        :columns="columns"
        :data-source="records"
        :pagination="false"
        :row-key="(record: CallbackRecord) => record.id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'bizType'">
            <a-tag :color="bizTypeColorMap[record.bizType] || 'default'">
              {{ $t(`demos.callback.bizType.${record.bizType}`) }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'verifyResult'">
            <a-tag :color="record.verifyResult ? 'success' : 'error'">
              {{
                record.verifyResult
                  ? $t('demos.callback.records.verifyStatus.success')
                  : $t('demos.callback.records.verifyStatus.failed')
              }}
            </a-tag>
          </template>
          <template
            v-else-if="column.dataIndex === 'bizNo' || column.dataIndex === 'mchNo' || column.dataIndex === 'appId'"
          >
            <span class="font-mono text-xs">{{ record[column.dataIndex] || '-' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span>{{ record.amount || '-' }}</span>
          </template>
        </template>

        <!-- 展开行：原始报文 -->
        <template #expandedRowRender="{ record }">
          <pre
            class="m-0 max-h-60 overflow-auto rounded bg-black/5 p-3 font-mono text-xs whitespace-pre-wrap break-all"
            >{{ record.rawBody }}</pre
          >
        </template>

        <template #emptytext>
          {{ $t('demos.callback.records.empty') }}
        </template>
      </a-table>
    </a-card>
  </Page>
</template>

<script lang="ts" setup>
  import type { DemoMessageResult, DemoScene } from '#/api/demo/artemis-demo.api';

  import { computed, onUnmounted, ref } from 'vue';

  import { Page } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { ArtemisDemoApi } from '#/api/demo/artemis-demo.api';
  import { useMessage } from '#/hooks/useMessage';

  const { confirm, message } = useMessage();

  // 三类场景各自的输入内容
  const queueContent = ref<string>('');
  const topicContent = ref<string>('');
  const delayContent = ref<string>('');
  const delaySeconds = ref<number>(5);

  // 消费记录列表
  const records = ref<DemoMessageResult[]>([]);
  // 轮询定时器
  let pollTimer: null | ReturnType<typeof setInterval> = null;

  /**
   * 拉取最新的消费记录
   */
  async function refreshRecords() {
    const { data } = await ArtemisDemoApi.list();
    records.value = data ?? [];
  }

  /**
   * 发送点对点队列消息
   */
  async function sendQueue() {
    if (!queueContent.value) {
      // 国际化：请输入消息内容
      message.warning($t('demos.artemis.messages.contentRequired'));
      return;
    }
    await ArtemisDemoApi.send({
      scene: 'QUEUE' as DemoScene,
      content: queueContent.value,
    });
    // 国际化：发送成功
    message.success($t('demos.artemis.messages.sendSuccess'));
    queueContent.value = '';
    await refreshRecords();
  }

  /**
   * 发送发布订阅消息
   */
  async function sendTopic() {
    if (!topicContent.value) {
      message.warning($t('demos.artemis.messages.contentRequired'));
      return;
    }
    await ArtemisDemoApi.send({
      scene: 'TOPIC' as DemoScene,
      content: topicContent.value,
    });
    message.success($t('demos.artemis.messages.sendSuccess'));
    topicContent.value = '';
    await refreshRecords();
  }

  /**
   * 发送延时消息
   */
  async function sendDelay() {
    if (!delayContent.value) {
      message.warning($t('demos.artemis.messages.contentRequired'));
      return;
    }
    await ArtemisDemoApi.send({
      scene: 'DELAY' as DemoScene,
      content: delayContent.value,
      delaySeconds: delaySeconds.value,
    });
    message.success($t('demos.artemis.messages.sendSuccess'));
    delayContent.value = '';
    await refreshRecords();
  }

  /**
   * 清空消费记录（带二次确认）
   */
  function clearRecords() {
    confirm({
      // 国际化：确定要清空全部消费记录吗？
      title: $t('demos.artemis.messages.clearConfirm'),
      onOk: async () => {
        await ArtemisDemoApi.clear();
        // 国际化：清空成功
        message.success($t('demos.artemis.messages.clearSuccess'));
        await refreshRecords();
      },
    });
  }

  // 表格列定义（响应语言切换）
  const columns = computed(() => [
    { title: $t('demos.artemis.records.columns.scene'), dataIndex: 'scene', width: 90 },
    { title: $t('demos.artemis.records.columns.content'), dataIndex: 'content', ellipsis: true },
    { title: $t('demos.artemis.records.columns.sendTime'), dataIndex: 'sendTime', width: 180 },
    { title: $t('demos.artemis.records.columns.consumeTime'), dataIndex: 'consumeTime', width: 180 },
    { title: $t('demos.artemis.records.columns.costMillis'), dataIndex: 'costMillis', width: 100 },
    { title: $t('demos.artemis.records.columns.consumer'), dataIndex: 'consumer', width: 200 },
    { title: $t('demos.artemis.records.columns.producerTraceId'), dataIndex: 'producerTraceId', width: 160 },
    { title: $t('demos.artemis.records.columns.consumerTraceId'), dataIndex: 'consumerTraceId', width: 160 },
    { title: $t('demos.artemis.records.columns.tracePropagated'), dataIndex: 'tracePropagated', width: 110 },
  ]);

  // 场景标签颜色映射
  const sceneColorMap: Record<string, string> = {
    DELAY: 'orange',
    QUEUE: 'blue',
    TOPIC: 'green',
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
  <Page :description="$t('demos.artemis.description')" :title="$t('demos.artemis.title')">
    <!-- 四类发送场景 -->
    <a-row :gutter="16">
      <!-- 点对点队列 -->
      <a-col :span="12">
        <a-card class="!mb-4 h-full" :title="$t('demos.artemis.scene.queue.title')">
          <p class="mb-3 text-gray-500 text-sm">
            {{ $t('demos.artemis.scene.queue.description') }}
          </p>
          <a-input-search
            v-model:value="queueContent"
            :placeholder="$t('demos.artemis.form.contentPlaceholder')"
            enter-button
            @search="sendQueue"
          >
            <template #enterButton>
              <a-button type="primary">{{ $t('demos.artemis.form.send') }}</a-button>
            </template>
          </a-input-search>
        </a-card>
      </a-col>

      <!-- 发布订阅 -->
      <a-col :span="12">
        <a-card class="!mb-4 h-full" :title="$t('demos.artemis.scene.topic.title')">
          <p class="mb-3 text-gray-500 text-sm">
            {{ $t('demos.artemis.scene.topic.description') }}
          </p>
          <a-input-search
            v-model:value="topicContent"
            :placeholder="$t('demos.artemis.form.contentPlaceholder')"
            enter-button
            @search="sendTopic"
          >
            <template #enterButton>
              <a-button type="primary">{{ $t('demos.artemis.form.broadcast') }}</a-button>
            </template>
          </a-input-search>
        </a-card>
      </a-col>

      <!-- 延时消息 -->
      <a-col :span="12">
        <a-card class="!mb-4 h-full" :title="$t('demos.artemis.scene.delay.title')">
          <p class="mb-3 text-gray-500 text-sm">
            {{ $t('demos.artemis.scene.delay.description') }}
          </p>
          <a-space-compact style="width: 100%">
            <a-input
              v-model:value="delayContent"
              :placeholder="$t('demos.artemis.form.contentPlaceholder')"
              style="flex: 1"
              @press-enter="sendDelay"
            />
            <a-input-number v-model:value="delaySeconds" :max="300" :min="1" style="width: 110px" />
            <a-button type="primary" @click="sendDelay">
              {{ $t('demos.artemis.form.send') }}
            </a-button>
          </a-space-compact>
        </a-card>
      </a-col>
    </a-row>

    <!-- 消费记录 -->
    <a-card>
      <template #title>
        <div class="flex items-center gap-2">
          <span>{{ $t('demos.artemis.records.title') }}</span>
          <a-tag color="processing">2s</a-tag>
        </div>
      </template>
      <template #extra>
        <a-space>
          <a-button size="small" @click="refreshRecords">
            {{ $t('demos.artemis.records.refresh') }}
          </a-button>
          <a-button danger size="small" @click="clearRecords">
            {{ $t('demos.artemis.records.clear') }}
          </a-button>
        </a-space>
      </template>

      <p class="mb-3 text-gray-400 text-xs">
        {{ $t('demos.artemis.records.description') }}
      </p>

      <a-table
        :columns="columns"
        :data-source="records"
        :pagination="false"
        :row-key="(record: DemoMessageResult) => record.id + record.consumer"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'scene'">
            <a-tag :color="sceneColorMap[record.scene] || 'default'">
              {{ record.scene }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'costMillis'">
            <span :class="record.costMillis > 1000 ? 'text-orange-500' : ''">
              {{ record.costMillis }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'tracePropagated'">
            <a-tag :color="record.tracePropagated ? 'success' : 'error'">
              {{ record.tracePropagated
                ? $t('demos.artemis.records.traceStatus.success')
                : $t('demos.artemis.records.traceStatus.failed') }}
            </a-tag>
          </template>
          <template
            v-else-if="
              column.dataIndex === 'producerTraceId' ||
              column.dataIndex === 'consumerTraceId'
            "
          >
            <span class="font-mono text-xs">{{ record[column.dataIndex] || '-' }}</span>
          </template>
        </template>

        <template #emptytext>
          {{ $t('demos.artemis.records.empty') }}
        </template>
      </a-table>
    </a-card>
  </Page>
</template>

<script lang="ts" setup>
  import type { NotifyNoticeBrief } from '#/api/system/notify/user.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { MdPreview } from 'md-editor-v3';

  import { NotifyUserApi } from '#/api/system/notify/user.api';
  import { useMessage } from '#/hooks/useMessage';
  import { useNotifyStore } from '#/store/notify';

  import 'md-editor-v3/lib/style.css';
  import 'md-editor-v3/lib/preview.css';

  const store = useNotifyStore();
  const { confirm, message } = useMessage();

  const loading = ref(false);
  // 通知列表
  const list = ref<NotifyNoticeBrief[]>([]);
  // 标题筛选
  const title = ref('');
  // 仅未读
  const onlyUnread = ref(false);

  // 详情弹窗
  const detailOpen = ref(false);
  const detail = ref<NotifyNoticeBrief>();

  /**
   * 类型文本
   */
  function typeText(v?: string) {
    return v === 'message' ? $t('system.notify.messageType') : $t('system.notify.noticeType');
  }

  /**
   * 拉取通知列表
   */
  function fetchList() {
    loading.value = true;
    NotifyUserApi.page({ onlyUnread: onlyUnread.value })
      .then(({ data }) => {
        let records = data ?? [];
        if (title.value) {
          const kw = title.value.trim();
          records = records.filter((n) => (n.title ?? '').includes(kw));
        }
        list.value = records;
        loading.value = false;
      })
      .catch(() => {
        list.value = [];
        loading.value = false;
      });
  }

  /**
   * 重置筛选
   */
  function resetFilter() {
    title.value = '';
    onlyUnread.value = false;
    fetchList();
  }

  /**
   * 标记单条已读
   */
  async function handleRead(row: NotifyNoticeBrief) {
    if (!row.type || !row.id) return;
    await NotifyUserApi.read(row.type, row.id);
    row.isRead = true;
    store.refresh().catch(() => {});
  }

  /**
   * 查看正文(独立请求详情, 未读则自动标记已读)
   */
  async function handleView(row: NotifyNoticeBrief) {
    if (!row.type || !row.id) return;
    const { data } = await NotifyUserApi.detail(row.type, row.id);
    detail.value = data;
    detailOpen.value = true;
    // 以列表行阅读状态判定, 未读则标记(标记用原 row 的 type/id)
    if (!row.isRead) {
      handleRead(row);
    }
  }

  /**
   * 全部已读
   */
  function handleReadAll() {
    confirm({
      title: $t('system.notify.readAll'),
      content: $t('system.notify.confirmReadAll'),
      onOk: () => {
        NotifyUserApi.readAll().then(() => {
          message.success($t('common.saveSuccess'));
          fetchList();
          store.refresh().catch(() => {});
        });
      },
    });
  }

  onMounted(() => {
    fetchList();
  });
</script>

<template>
  <div class="m-3 list-page-compact rounded-lg bg-background p-3">
    <!-- 筛选 -->
    <a-card>
      <a-form layout="inline">
        <a-form-item :label="$t('system.notify.titleField')">
          <a-input
            v-model:value="title"
            allow-clear
            :placeholder="$t('system.notify.inputTitle')"
            @press-enter="fetchList"
          />
        </a-form-item>
        <a-form-item :label="$t('system.notify.readStatus')">
          <a-radio-group v-model:value="onlyUnread" @change="fetchList" button-style="solid">
            <a-radio-button :value="false">{{ $t('system.notify.all') }}</a-radio-button>
            <a-radio-button :value="true">{{ $t('system.notify.onlyUnread') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchList">{{ $t('common.query') }}</a-button>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetFilter">{{ $t('common.reset') }}</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar custom refresh :refresh-options="{ queryMethod: fetchList }">
          <template #buttons>
            <a-space>
              <a-button type="primary" :disabled="!list.some((n) => !n.isRead)" @click="handleReadAll">
                {{ $t('system.notify.readAll') }}
              </a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <!-- 通知列表 -->
        <vxe-table :row-config="{ keyField: 'id' }" :data="list" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 标题(点击查看正文, important 红色) -->
          <vxe-column field="title" :title="$t('system.notify.titleField')" :min-width="220">
            <template #default="{ row }">
              <a
                class="block truncate cursor-pointer font-medium hover:underline"
                :class="{ 'text-red-500': row.severity === 'important' }"
                @click="handleView(row)"
              >
                {{ row.title }}
              </a>
            </template>
          </vxe-column>
          <!-- 类型 -->
          <vxe-column field="type" :title="$t('system.notify.typeField')" :width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="row.type === 'message' ? 'blue' : 'green'">{{ typeText(row.type) }}</a-tag>
            </template>
          </vxe-column>
          <!-- 重要程度 -->
          <vxe-column field="severity" :title="$t('system.notify.severity')" :width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.severity === 'important'" color="red">{{ $t('system.notify.severityImportant') }}</a-tag>
              <span v-else-if="row.type === 'notice'">{{ $t('system.notify.severityNormal') }}</span>
              <span v-else>-</span>
            </template>
          </vxe-column>
          <!-- 置顶 -->
          <vxe-column field="isTop" :title="$t('system.notify.isTop')" :width="80" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.isTop" color="gold">{{ $t('system.notify.isTop') }}</a-tag>
              <span v-else>-</span>
            </template>
          </vxe-column>
          <!-- 读状态 -->
          <vxe-column field="isRead" :title="$t('system.notify.readStatus')" :width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.isRead" color="default">{{ $t('system.notify.read') }}</a-tag>
              <a-tag v-else color="processing">{{ $t('system.notify.unread') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column
            field="createTime"
            :title="$t('system.notify.createTime')"
            :width="160"
            formatter="formatDateTime"
          />
          <!-- 操作 -->
          <vxe-column fixed="right" :width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <!-- 标为已读 -->
              <a-button v-if="!row.isRead" type="link" size="small" @click="handleRead(row)">{{
                $t('system.notify.markRead')
              }}</a-button>
              <span v-else>-</span>
            </template>
          </vxe-column>
        </vxe-table>
      </a-card>
    </div>

    <!-- 正文详情 -->
    <a-modal
      :open="detailOpen"
      :title="detail?.title"
      :footer="null"
      width="800"
      :mask-closable="false"
      :body-style="{ minHeight: '520px' }"
      @cancel="detailOpen = false"
    >
      <div v-if="detail" class="notify-detail">
        <!-- 元信息区: 类型/重要程度/置顶/创建时间 -->
        <div class="notify-meta">
          <!-- 类型 -->
          <a-tag :color="detail.type === 'message' ? 'blue' : 'green'">{{ typeText(detail.type) }}</a-tag>
          <!-- 重要程度 -->
          <a-tag v-if="detail.severity === 'important'" color="red">{{ $t('system.notify.severityImportant') }}</a-tag>
          <a-tag v-else color="default">{{ $t('system.notify.severityNormal') }}</a-tag>
          <!-- 置顶 -->
          <a-tag v-if="detail.isTop" color="gold">{{ $t('system.notify.isTop') }}</a-tag>
          <!-- 创建时间 -->
          <span class="meta-time">
            <IconifyIcon icon="ant-design:clock-circle-outlined" class="meta-time-icon" />
            {{ formatDateTime(detail.createTime) }}
          </span>
        </div>
        <!-- 正文区(超出滚动) -->
        <div class="notify-body">
          <MdPreview :model-value="detail.message ?? ''" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
  /* 详情弹窗: 固定最小高度, 内容多时正文区滚动 */
  .notify-detail {
    display: flex;
    flex-direction: column;
  }

  /* 元信息横排标签流 */
  .notify-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .meta-time {
    display: inline-flex;
    align-items: center;
    margin-left: auto;
    color: #909399;
    font-size: 13px;
  }

  .meta-time-icon {
    margin-right: 4px;
  }

  /* 正文区: 限高滚动 + 浅灰卡片底 */
  .notify-body {
    max-height: calc(70vh - 200px);
    overflow-y: auto;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;
  }
</style>

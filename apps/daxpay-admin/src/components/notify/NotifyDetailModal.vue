<script lang="ts" setup>
  import type { NotifyNoticeBrief } from '#/api/system/notify/user.api';

  import { ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { MdPreview } from 'md-editor-v3';

  import { NotifyUserApi } from '#/api/system/notify/user.api';

  import 'md-editor-v3/lib/style.css';
  import 'md-editor-v3/lib/preview.css';

  /** 查看目标(通知类型 + 主键) */
  interface NotifyDetailTarget {
    /** 主键 */
    id: string;
    /** 通知类型(notice公告/message个人消息) */
    type: string;
  }

  /** 组件属性: open 弹窗开关, target 查看目标 */
  interface Props {
    open: boolean;
    target: NotifyDetailTarget | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{ 'update:open': [value: boolean] }>();

  // 详情数据与加载状态
  const detail = ref<NotifyNoticeBrief>();
  const loading = ref(false);

  /**
   * 类型文本
   */
  function typeText(v?: string) {
    return v === 'message' ? $t('system.notify.messageType') : $t('system.notify.noticeType');
  }

  /**
   * 请求完整正文(独立详情接口, 不复用列表摘要数据)
   */
  async function fetchDetail(target: NotifyDetailTarget) {
    // 先清旧数据, 避免请求期间闪现上一次内容
    detail.value = undefined;
    loading.value = true;
    try {
      const { data } = await NotifyUserApi.detail(target.type, target.id);
      detail.value = data;
    } finally {
      loading.value = false;
    }
  }

  // 打开时拉取详情
  watch(
    () => props.open,
    (val) => {
      if (val && props.target) {
        fetchDetail(props.target);
      }
    },
  );
</script>

<template>
  <a-modal
    :open="open"
    :title="detail?.title"
    :footer="null"
    width="800"
    :mask-closable="false"
    :body-style="{ minHeight: '520px' }"
    @cancel="emit('update:open', false)"
  >
    <a-spin :spinning="loading">
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
    </a-spin>
  </a-modal>
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

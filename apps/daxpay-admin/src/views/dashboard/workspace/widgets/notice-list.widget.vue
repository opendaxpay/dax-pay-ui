<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { MdPreview } from 'md-editor-v3';

  import { type NotifyNotice, NotifyNoticeApi } from '#/api/system/notify/notice.api';

  import 'md-editor-v3/lib/style.css';

  interface Props {
    /** 工作台聚合数据（公告独立拉数据，不消费统计） */
    data?: DashboardData;
  }

  defineOptions({ name: 'NoticeListWidget' });

  // 公告独立拉取数据，不消费聚合数据；保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const router = useRouter();
  const loading = ref(false);
  const records = ref<NotifyNotice[]>([]);

  // 公告正文查看弹窗（与右上角铃铛通知查看弹窗结构一致：a-modal + MdPreview）
  const detailOpen = ref(false);
  const detail = ref<NotifyNotice>();
  const detailLoading = ref(false);

  /** 拉取已发布公告（按时间倒序取 20 条） */
  async function load() {
    loading.value = true;
    const res: any = await NotifyNoticeApi.page({ current: 1, size: 20, status: 'published' });
    records.value = res?.data?.records || [];
    loading.value = false;
  }

  onMounted(load);

  /** 跳转到通知中心（"更多"按钮） */
  function goAll() {
    router.push({ name: 'NotifyCenter' }).catch(() => {});
  }

  /** 点击公告条目：打开弹窗查看正文（与铃铛查看一致，纯展示 title + Markdown content） */
  async function openDetail(row: NotifyNotice) {
    if (!row?.id) return;
    // 立即打开弹窗，title 先用列表已知值即时显示，正文异步加载
    detail.value = row;
    detailOpen.value = true;
    detailLoading.value = true;
    try {
      const { data } = await NotifyNoticeApi.findById(row.id);
      detail.value = data;
    } finally {
      detailLoading.value = false;
    }
  }

  /** 重要程度标签颜色 */
  function severityColor(severity?: string): string {
    // important 红色，normal 蓝色
    return severity === 'important' ? 'red' : 'blue';
  }

  /** 公告时间格式化：使用项目统一 formatDateTime，与时区及系统其他页面保持一致 */
  function fmtNoticeTime(time?: null | string): string {
    if (time === null || time === undefined || time === '') return '-';
    return formatDateTime(time) || '-';
  }
</script>

<template>
  <a-card variant="borderless" class="!bg-card !h-full">
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="lucide:megaphone" class="text-primary size-4" />
        <span>{{ $t('dashboard.workspace.widget.noticeList') }}</span>
      </div>
    </template>
    <template #extra>
      <a-button type="link" size="small" @click="goAll">{{ $t('common.more') }}</a-button>
    </template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" />
    <a-empty v-else-if="records.length === 0" class="!my-6" />
    <ul v-else class="notice-scroll flex max-h-[230px] flex-col gap-3 overflow-y-auto pr-1">
      <li
        v-for="(row, index) in records"
        :key="row.id ?? index"
        class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1 transition-colors"
        @click="openDetail(row)"
      >
        <a-tag v-if="row.severity" :color="severityColor(row.severity)" class="!m-0 shrink-0">
          {{
            row.severity === 'important'
              ? $t('dashboard.workspace.notice.important')
              : $t('dashboard.workspace.notice.normal')
          }}
        </a-tag>
        <span v-if="row.isTop" class="text-amber-500 shrink-0 text-xs"
          >[{{ $t('dashboard.workspace.notice.top') }}]</span
        >
        <span class="text-foreground/80 flex-1 truncate text-sm">{{ row.title || '-' }}</span>
        <span class="text-foreground/40 shrink-0 text-xs">{{
          fmtNoticeTime(row.lastModifiedTime || row.createTime)
        }}</span>
      </li>
    </ul>

    <!-- 公告正文查看弹窗（与右上角铃铛通知查看弹窗一致：a-modal + MdPreview 纯展示） -->
    <a-modal :open="detailOpen" :title="detail?.title" :footer="null" width="800" @cancel="detailOpen = false">
      <a-spin :spinning="detailLoading">
        <MdPreview v-if="detail?.content" :model-value="detail.content" />
      </a-spin>
    </a-modal>
  </a-card>
</template>

<style scoped>
  /* 滚动条美化：纤细半透明风格，与支付订单卡片一致 */
  .notice-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .notice-scroll::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 2px;
  }

  .notice-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
</style>

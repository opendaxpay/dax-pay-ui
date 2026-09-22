<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type NotifyNoticeBrief, NotifyUserApi } from '#/api/system/notify/user.api';
  import { NotifyDetailModal } from '#/components/notify';
  import { useNotifyStore } from '#/store/notify';

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
  // 通知 store：查看即读后经此刷新铃铛未读徽标与列表
  const notifyStore = useNotifyStore();
  const loading = ref(false);
  const records = ref<NotifyNoticeBrief[]>([]);

  // 公告正文查看弹窗(与顶栏铃铛、通知中心共用标准版组件: 类型/重要程度/置顶/时间元信息 + 正文)
  const detailOpen = ref(false);
  // 查看目标(通知类型 + 主键), 正文由弹窗组件内独立请求详情接口
  const viewTarget = ref<null | { id: string; type: string }>(null);

  /** 拉取可见公告(与顶栏铃铛、通知中心同源: 后端只返回已发布且在生效时间窗内、未被忽略的公告) */
  async function load() {
    loading.value = true;
    // /notify/user/page 为公告 + 个人消息聚合列表, 工作台卡片只展示公告, 取最新 20 条
    const { data } = await NotifyUserApi.page();
    records.value = (data ?? []).filter((item) => item.type === 'notice').slice(0, 20);
    loading.value = false;
  }

  onMounted(load);

  /** 跳转到通知中心（"更多"按钮） */
  function goAll() {
    router.push({ name: 'NotifyCenter' }).catch(() => {});
  }

  /** 点击公告条目：打开标准版详情弹窗查看正文（查看即标记已读，与铃铛、通知中心一致） */
  function openDetail(row: NotifyNoticeBrief) {
    if (!row?.id) return;
    viewTarget.value = { id: String(row.id), type: row.type ?? 'notice' };
    detailOpen.value = true;
    // 查看即读：未读则标记，store.markRead 内部会刷新未读徽标
    if (!row.isRead && row.type) {
      notifyStore.markRead(row.type, String(row.id));
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
        <span class="text-foreground/40 shrink-0 text-xs">{{ fmtNoticeTime(row.createTime) }}</span>
      </li>
    </ul>

    <!-- 公告正文查看弹窗（与顶栏铃铛、通知中心共用标准版组件：元信息 + 完整正文） -->
    <NotifyDetailModal v-model:open="detailOpen" :target="viewTarget" />
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

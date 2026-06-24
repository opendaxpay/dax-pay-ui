import { defineStore } from 'pinia';
import { ref } from 'vue';

import { NotifyUserApi, type NotifyNoticeBrief } from '#/api/system/notify/user.api';

/**
 * 站内通知 store(当前登录用户视角)
 *
 * 聚合公告与个人消息, 供顶部铃铛组件展示
 */
export const useNotifyStore = defineStore('notify', () => {
  /** 铃铛通知列表(公告 + 个人消息) */
  const list = ref<NotifyNoticeBrief[]>([]);

  /** 未读数(合计) */
  const unreadCount = ref(0);

  /**
   * 拉取未读数
   */
  async function fetchUnreadCount() {
    const { data } = await NotifyUserApi.unreadCount();
    unreadCount.value = data?.total ?? 0;
  }

  /**
   * 拉取铃铛列表
   */
  async function fetchList() {
    // 铃铛仅展示未读(已读不显示), 全部数据在通知中心查看
    const { data } = await NotifyUserApi.page({ onlyUnread: true });
    list.value = data ?? [];
  }

  /**
   * 标记单条已读
   */
  async function markRead(type: string, id: string) {
    await NotifyUserApi.read(type, id);
    await refresh();
  }

  /**
   * 全部已读(清空)
   */
  async function markAllRead() {
    await NotifyUserApi.readAll();
    await refresh();
  }

  /**
   * 忽略(隐藏单条)
   */
  async function ignore(type: string, id: string) {
    await NotifyUserApi.ignore(type, id);
    await refresh();
  }

  /**
   * 刷新未读数与列表
   */
  async function refresh() {
    await Promise.all([fetchUnreadCount(), fetchList()]);
  }

  /** SSE 连接实例(模块级, 避免响应式开销) */
  let eventSource: null | EventSource = null;

  /**
   * 建立 SSE 实时推送连接
   *
   * EventSource 不支持自定义请求头, 依赖同源 cookie 透传 Sa-Token 会话;
   * 收到推送时刷新未读数与铃铛列表.
   */
  function connectSSE() {
    disconnectSSE();
    const baseUrl = ((import.meta.env as any).VITE_GLOB_API_URL as string) || '';
    try {
      eventSource = new EventSource(`${baseUrl}/notify/user/sse/connect`, {
        withCredentials: true,
      });
      // 收到推送即刷新未读数与铃铛列表
      eventSource.onmessage = () => {
        refresh().catch(() => {});
      };
    } catch {
      // 浏览器不支持或连接失败, 退化到手动刷新
    }
  }

  /**
   * 断开 SSE 连接
   */
  function disconnectSSE() {
    eventSource?.close();
    eventSource = null;
  }

  return {
    connectSSE,
    disconnectSSE,
    fetchList,
    fetchUnreadCount,
    ignore,
    list,
    markAllRead,
    markRead,
    refresh,
    unreadCount,
  };
});

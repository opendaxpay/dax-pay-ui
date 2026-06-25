import { ref } from 'vue';

import { defineStore } from 'pinia';

import { type NotifyNoticeBrief, NotifyUserApi } from '#/api/system/notify/user.api';

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
  let eventSource: EventSource | null = null;

  /** 手动重连定时器(覆盖浏览器默认 3 秒重连, 避免重连风暴) */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** 连续重连次数(用于指数退避) */
  let reconnectAttempts = 0;

  /** 清除待执行的重连定时器 */
  function clearReconnect() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  /**
   * 安排下一次重连(指数退避: 2s 起步, 倍增封顶 30s)
   */
  function scheduleReconnect() {
    clearReconnect();
    // 2s, 4s, 8s, 16s, 30s, 30s ...
    const delay = Math.min(2000 * 2 ** reconnectAttempts, 30000);
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => connectSSE(), delay);
  }

  /**
   * 建立 SSE 实时推送连接
   *
   * EventSource 不支持自定义请求头, 依赖同源 cookie 透传 Sa-Token 会话;
   * 收到推送时刷新未读数与铃铛列表.
   * 防重入: 已存在活跃连接(OPEN/CONNECTING)时直接复用, 不重复建立;
   * 出错时主动关闭并改用指数退避手动重连, 避免浏览器默认的固定重连风暴.
   */
  function connectSSE() {
    // 已有活跃连接则复用, 避免重复建立产生多个连接互相顶替
    if (
      eventSource &&
      (eventSource.readyState === EventSource.OPEN ||
        eventSource.readyState === EventSource.CONNECTING)
    ) {
      return;
    }
    clearReconnect();
    const baseUrl = ((import.meta.env as any).VITE_GLOB_API_URL as string) || '';
    try {
      eventSource = new EventSource(`${baseUrl}/notify/user/sse/connect`, {
        withCredentials: true,
      });
      // 连接建立成功, 重置退避计数
      eventSource.onopen = () => {
        reconnectAttempts = 0;
      };
      // 收到推送即刷新未读数与铃铛列表
      eventSource.onmessage = () => {
        refresh().catch(() => {});
      };
      // 出错主动关闭, 改用指数退避手动重连, 关闭浏览器默认的固定重连
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        scheduleReconnect();
      };
    } catch {
      // 浏览器不支持或构造失败, 退化到指数退避重试
      scheduleReconnect();
    }
  }

  /**
   * 断开 SSE 连接(同步清理重连定时器与退避状态)
   */
  function disconnectSSE() {
    clearReconnect();
    reconnectAttempts = 0;
    eventSource?.close();
    eventSource = null;
  }

  /**
   * 重置 store(setup 语法需手动实现 $reset, 退出登录时由 resetAllStores 调用)
   */
  function $reset() {
    list.value = [];
    unreadCount.value = 0;
    disconnectSSE();
  }

  return {
    $reset,
    connectSSE,
    disconnectSSE,
    ignore,
    list,
    markAllRead,
    markRead,
    refresh,
    unreadCount,
  };
});

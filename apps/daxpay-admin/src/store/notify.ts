import { ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { type NotifyNoticeBrief, NotifyUserApi } from '#/api/system/notify/user.api';
import { CLIENT_CODE } from '#/constants/client';

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
  let reconnectTimer: null | ReturnType<typeof setTimeout> = null;

  /** 连续重连次数(用于指数退避) */
  let reconnectAttempts = 0;

  /** 是否处于连接关注状态(断连后异步探活返回时不再建连) */
  let sseActive = false;

  /** 是否正在探活建连(探活是异步的, 用于防重入) */
  let connecting = false;

  /** 「会话有效但 SSE 仍连不上」的连续次数: 超过阈值退回指数退避, 避免 1 秒重连风暴 */
  let rescueAttempts = 0;

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
    const delay = Math.min(2000 * 2 ** reconnectAttempts, 30_000);
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => connectSSE(), delay);
  }

  /**
   * 探活当前会话(顺带让后端把 token 重写进 Cookie)
   *
   * EventSource 不能自定义请求头, 只能靠 `Accesstoken` 同源 Cookie 透传会话; 这里用最轻的接口
   * 带请求头打一次, 后端在该 Cookie 缺失/过期/被同 host 其它端覆盖时会按请求头里的 token 重写,
   * 于是下一次建连就能成功. 返回状态用于区分「Cookie 问题」与「会话失效」.
   *
   * @returns ok=会话有效; unauthorized=会话失效; unknown=网络/网关异常
   */
  async function probeSession(): Promise<'ok' | 'unauthorized' | 'unknown'> {
    const token = useAccessStore().accessToken;
    if (!token) {
      return 'unauthorized';
    }
    const baseUrl = ((import.meta.env as any).VITE_GLOB_API_URL as string) || '';
    try {
      const res = await fetch(`${baseUrl}/notify/user/unread-count`, {
        headers: { Accesstoken: token, 'x-client-code': CLIENT_CODE },
      });
      if (res.ok) {
        return 'ok';
      }
      return res.status === 401 ? 'unauthorized' : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * 建立 SSE 实时推送连接
   *
   * EventSource 不支持自定义请求头, 依赖同源 `Accesstoken` Cookie 透传会话, 因此建连前先探活一次,
   * 由后端按请求头里的 token 重写 Cookie, 解决 Cookie 过期/被清/被同 host 其它端覆盖导致的长期 401.
   * 防重入: 已存在活跃连接(OPEN/CONNECTING)或正在探活时直接复用;
   * 出错时主动关闭并改用指数退避手动重连, 避免浏览器默认的固定重连风暴.
   */
  function connectSSE() {
    // 已有活跃连接或正在探活则复用, 避免重复建立产生多个连接互相顶替
    if (
      connecting ||
      (eventSource &&
        (eventSource.readyState === EventSource.OPEN ||
          eventSource.readyState === EventSource.CONNECTING))
    ) {
      return;
    }
    clearReconnect();
    sseActive = true;
    connecting = true;
    probeSession()
      .then((state) => {
        if (!sseActive) {
          return;
        }
        // 会话已失效: 不建连也不重连, 交给全局 401 流程引导重新登录
        if (state === 'unauthorized') {
          reconnectAttempts = 0;
          return;
        }
        openEventSource();
      })
      .finally(() => {
        connecting = false;
      });
  }

  /**
   * 建立 EventSource 连接(探活通过后调用, 也是唯一创建连接的地方)
   */
  function openEventSource() {
    const baseUrl = ((import.meta.env as any).VITE_GLOB_API_URL as string) || '';
    try {
      eventSource = new EventSource(`${baseUrl}/notify/user/sse/connect`, {
        withCredentials: true,
      });
      // 连接建立成功, 重置退避与自愈计数
      eventSource.onopen! = () => {
        reconnectAttempts = 0;
        rescueAttempts = 0;
      };
      // 收到推送即刷新未读数与铃铛列表
      eventSource.onmessage! = () => {
        refresh().catch(() => {});
      };
      // 出错先关闭, 再探活区分「会话失效」与「Cookie 缺失」后决定重连方式
      eventSource.onerror! = () => {
        eventSource?.close();
        eventSource = null;
        handleConnectError().catch(() => scheduleReconnect());
      };
    } catch {
      // 浏览器不支持或构造失败, 退化到指数退避重试
      scheduleReconnect();
    }
  }

  /**
   * 连接失败后的处置(用带请求头的探活区分故障类型)
   *
   * - 会话有效: 探活请求已让后端重写 Cookie, 1 秒后立即重连(不计入退避);
   *   连续多次仍失败(如浏览器禁用 Cookie)则退回指数退避
   * - 会话失效: 停止重连, 交给全局 401 流程处理
   * - 网络异常: 保持指数退避
   */
  async function handleConnectError() {
    if (!sseActive) {
      return;
    }
    const state = await probeSession();
    if (!sseActive) {
      return;
    }
    if (state === 'ok') {
      reconnectAttempts = 0;
      rescueAttempts += 1;
      clearReconnect();
      if (rescueAttempts <= 3) {
        reconnectTimer = setTimeout(() => connectSSE(), 1000);
        return;
      }
      scheduleReconnect();
      return;
    }
    if (state === 'unauthorized') {
      reconnectAttempts = 0;
      return;
    }
    scheduleReconnect();
  }

  /**
   * 断开 SSE 连接(同步清理重连定时器与退避状态)
   */
  function disconnectSSE() {
    clearReconnect();
    reconnectAttempts = 0;
    rescueAttempts = 0;
    sseActive = false;
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

import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 用户端通知 API(当前登录用户)
 */
export const NotifyUserApi = {
  /**
   * 未读数
   */
  unreadCount(): Promise<Result<NotifyUnreadCount>> {
    return defHttp.get({ url: '/notify/user/unread-count' });
  },
  /**
   * 铃铛通知列表
   */
  page(params?: { onlyUnread?: boolean }): Promise<Result<NotifyNoticeBrief[]>> {
    return defHttp.get({ url: '/notify/user/page', params });
  },
  /**
   * 标记单条已读
   */
  read(type: string, id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/user/read', params: { type, id } });
  },
  /**
   * 全部已读(清空)
   */
  readAll(): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/user/read-all' });
  },
  /**
   * 忽略(隐藏)
   */
  ignore(type: string, id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/user/ignore', params: { type, id } });
  },
};

/**
 * 未读数
 */
export interface NotifyUnreadCount {
  /** 公告未读数 */
  noticeCount?: number;
  /** 个人消息未读数 */
  messageCount?: number;
  /** 合计未读数 */
  total?: number;
}

/**
 * 通知项(铃铛, 公告与个人消息统一结构)
 */
export interface NotifyNoticeBrief {
  /** 主键 */
  id?: string;
  /** 通知类型(notice公告/message个人消息) */
  type?: string;
  /** 标题 */
  title?: string;
  /** 内容摘要 */
  message?: string;
  /** 重要程度(公告专用) */
  severity?: string;
  /** 是否置顶(公告专用) */
  isTop?: boolean;
  /** 是否已读 */
  isRead?: boolean;
  /** 跳转链接(个人消息专用) */
  link?: string;
  /** 创建时间 */
  createTime?: string;
}

interface NotificationItem {
  id: number | string;
  avatar?: string;
  /**
   * 通知类型(notice 公告 / message 个人消息), 用于切换图标
   */
  type?: string;
  /**
   * 未读数, 用于铃铛图标角标显示
   */
  count?: number;
  /**
   * 重要程度(important 重要), 用于标题红色标注
   */
  severity?: string;
  date: string;
  isRead?: boolean;
  message: string;
  title: string;
  /**
   * 跳转链接，可以是路由路径或完整 URL
   * @example '/dashboard' 或 'https://example.com'
   */
  link?: string;
  query?: Record<string, any>;
  state?: Record<string, any>;
}

export type { NotificationItem };

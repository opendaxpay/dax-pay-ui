import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台公告 API（商户端只读）
 *
 * 仅暴露已发布公告的查询；发布中/下线/草稿的管理动作在运营端。
 */
export const NotifyNoticeApi = {
  /**
   * 已发布公告分页查询（后端强制 published 且在生效时间窗内，置顶优先）
   */
  page(params: any): Promise<Result<PageResult<NotifyNotice>>> {
    return defHttp.get({ url: '/mch/dashboard/notice/page', params });
  },
  /**
   * 公告详情（仅发布中可见，草稿/下线/过期视为不存在）
   */
  findById(id: string): Promise<Result<NotifyNotice>> {
    return defHttp.get({ url: '/mch/dashboard/notice/get-by-id', params: { id } });
  },
};

/**
 * 公告
 */
export interface NotifyNotice extends BaseEntity {
  /** 标题 */
  title?: string;
  /** 正文(Markdown) */
  content?: string;
  /** 重要程度 */
  severity?: string;
  /** 是否置顶 */
  isTop?: boolean;
  /** 生效时间 */
  effectiveTime?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 状态(draft草稿/published发布/offline下线) */
  status?: string;
  /** 最后修改时间 */
  lastModifiedTime?: string;
}

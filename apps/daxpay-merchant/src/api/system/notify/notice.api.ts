import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 公告管理 API
 */
export const NotifyNoticeApi = {
  /**
   * 公告分页查询
   */
  page(params: any): Promise<Result<PageResult<NotifyNotice>>> {
    return defHttp.get({ url: '/notify/notice/page', params });
  },
  /**
   * 公告详情
   */
  findById(id: string): Promise<Result<NotifyNotice>> {
    return defHttp.get({ url: '/notify/notice/get', params: { id } });
  },
  /**
   * 新建公告
   */
  add(data: NotifyNoticeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/notice/add', data });
  },
  /**
   * 编辑公告
   */
  update(data: NotifyNoticeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/notice/update', data });
  },
  /**
   * 删除公告
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/notice/delete', params: { id } });
  },
  /**
   * 发布公告
   */
  publish(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/notice/publish', params: { id } });
  },
  /**
   * 下线公告
   */
  offline(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/notice/offline', params: { id } });
  },
};

/**
 * 公告参数(新建/编辑)
 */
export interface NotifyNoticeParam {
  /** 主键 */
  id?: string;
  /** 标题 */
  title?: string;
  /** 正文(Markdown) */
  content?: string;
  /** 重要程度(normal普通/important重要) */
  severity?: string;
  /** 是否置顶 */
  isTop?: boolean;
  /** 生效时间 */
  effectiveTime?: string;
  /** 过期时间 */
  expireTime?: string;
}

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

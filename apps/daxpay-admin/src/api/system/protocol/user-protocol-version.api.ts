import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 用户协议版本管理 API
 */
export const UserProtocolVersionApi = {
  /** 分页查询版本 */
  page(params: any): Promise<Result<PageResult<UserProtocolVersion>>> {
    return defHttp.get({ url: '/user/protocol/version/page', params });
  },
  /** 获取版本详情 */
  findById(id: string): Promise<Result<UserProtocolVersion>> {
    return defHttp.get({ url: '/user/protocol/version/get', params: { id } });
  },
  /** 新建草稿 */
  add(data: UserProtocolVersion): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/version/add', data });
  },
  /** 编辑草稿内容(仅草稿可编辑) */
  update(data: UserProtocolVersion): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/version/update', data });
  },
  /** 删除草稿(仅草稿可删除) */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/version/delete', params: { id } });
  },
  /** 发布版本(草稿 -> 已发布, 同语言原已发布自动归档) */
  publish(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/version/publish', params: { id } });
  },
  /** 归档版本(已发布 -> 归档) */
  archive(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/version/archive', params: { id } });
  },
};

/** 用户协议版本 */
export interface UserProtocolVersion extends BaseEntity {
  /** 协议ID */
  protocolId?: string;
  /** 语言 */
  language?: string;
  /** 版本号 */
  versionNo?: number;
  /** 版本标签 */
  versionLabel?: string;
  /** 标题 */
  title?: string;
  /** 内容(Markdown) */
  content?: string;
  /** 渲染后的HTML */
  contentHtml?: string;
  /** 内容格式 */
  contentFormat?: string;
  /** 状态: DRAFT/PUBLISHED/ARCHIVED */
  status?: string;
  /** 生效时间 */
  effectiveTime?: string;
  /** 变更说明 */
  summary?: string;
}

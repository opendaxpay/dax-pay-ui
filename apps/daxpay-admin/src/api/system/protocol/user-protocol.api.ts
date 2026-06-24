import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 用户协议管理 API
 */
export const UserProtocolApi = {
  /** 分页查询用户协议 */
  page(params: any): Promise<Result<PageResult<UserProtocol>>> {
    return defHttp.get({ url: '/user/protocol/page', params });
  },
  /** 获取用户协议详情 */
  findById(id: string): Promise<Result<UserProtocol>> {
    return defHttp.get({ url: '/user/protocol/get', params: { id } });
  },
  /** 新增用户协议 */
  add(data: UserProtocol): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/add', data });
  },
  /** 修改用户协议 */
  update(data: UserProtocol): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/update', data });
  },
  /** 删除用户协议 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/delete', params: { id } });
  },
  /** 设置为默认协议 */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/set-default', params: { id } });
  },
  /** 取消默认协议 */
  cancelDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/protocol/cancel-default', params: { id } });
  },
  /** 复制协议到其他端(连同各语言当前生效版本) */
  copyToClient(id: string, clientType: string): Promise<Result<string>> {
    return defHttp.post({ url: '/user/protocol/copy-to-client', params: { id, clientType } });
  },
  /** 协议类型列表 */
  typeOptions(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/user/protocol/type-options' });
  },
  /** 协议端类型列表 */
  clientTypeOptions(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/user/protocol/client-type-options' });
  },
  /** 查询默认协议内容(对外, 各端展示用) */
  findDefault(type: string, clientType: string, language?: string): Promise<Result<UserProtocolContent>> {
    return defHttp.get({ url: '/user/protocol/find-default', params: { type, clientType, language } });
  },
};

/** 用户协议 */
export interface UserProtocol extends BaseEntity {
  /** 名称 */
  name?: string;
  /** 显示名称 */
  showName?: string;
  /** 类型 */
  type?: string;
  /** 端类型 */
  clientType?: string;
  /** 默认协议 */
  defaultProtocol?: boolean;
  /** 默认语言 */
  defaultLanguage?: string;
}

/** 用户协议内容(对外展示) */
export interface UserProtocolContent extends BaseEntity {
  /** 名称 */
  name?: string;
  /** 显示名称 */
  showName?: string;
  /** 类型 */
  type?: string;
  /** 端类型 */
  clientType?: string;
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
  /** 生效时间 */
  effectiveTime?: string;
}

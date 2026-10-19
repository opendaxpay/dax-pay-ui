import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 用户协议 API（商户端只读展示）
 *
 * 协议管理端点(page/add/update/delete/version 等)挂运营端 system:protocol 菜单, 商户端角色绑不上恒 403,
 * 且商户端无管理页面, 已删除死代码; 登录页协议展示只走免登录的 find-default。
 */
export const UserProtocolApi = {
  /** 查询默认协议内容(对外, 各端展示用; 协议未配置时会抛异常, 静默错误由调用方自行处理空态) */
  findDefault(type: string, clientType: string, language?: string): Promise<Result<UserProtocolContent>> {
    return defHttp.get({
      url: '/user/protocol/find-default',
      params: { type, clientType, language },
      silentError: true,
    });
  },
};

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

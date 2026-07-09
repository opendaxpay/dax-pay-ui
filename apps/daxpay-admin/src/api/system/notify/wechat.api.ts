import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信消息通知配置 API
 * 仅管理场景模板 Id(存 system_platform_config / wechat_notify);
 * 公众号 AppId/AppSecret 在三方平台管理(加密配置 wechat_mp_auth)
 */
export const WechatConfigApi = {
  /** 查询配置 */
  find(): Promise<Result<WechatConfigResult>> {
    return defHttp.get({ url: '/notify/wechat/config/find' });
  },
  /** 更新配置 */
  update(data: WechatConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/wechat/config/update', data });
  },
};

/**
 * 微信通知记录 API
 */
export const WechatMessageApi = {
  /** 分页查询 */
  page(params: any): Promise<Result<PageResult<WechatMessageRecord>>> {
    return defHttp.get({ url: '/notify/wechat/message/page', params });
  },
  /** 记录详情 */
  findById(id: string): Promise<Result<WechatMessageRecord>> {
    return defHttp.get({ url: '/notify/wechat/message/get', params: { id } });
  },
  /** 重发失败消息 */
  resend(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/wechat/message/resend', params: { id } });
  },
  /** 测试发送(发给当前登录用户, 验证三方平台凭据+绑定+模板链路) */
  testSend(): Promise<Result<MessageSendResult>> {
    return defHttp.post({ url: '/notify/wechat/message/test-send' });
  },
};

/**
 * 微信消息通知配置参数(编辑)
 */
export interface WechatConfigParam {
  /** 交易通知模板Id */
  tradeTemplateId?: string;
  /** 操作通知模板Id */
  operateTemplateId?: string;
}

/**
 * 微信消息通知配置结果(平台非加密配置, 无 BaseEntity 字段)
 */
export interface WechatConfigResult {
  tradeTemplateId?: string;
  operateTemplateId?: string;
}

/**
 * 微信消息记录
 */
export interface WechatMessageRecord extends BaseEntity {
  /** 接收平台用户ID */
  userId?: string;
  /** 消息类型(template/uniform) */
  messageType?: string;
  /** 接收者 OpenId */
  openId?: string;
  /** 模板ID */
  templateId?: string;
  /** 模板数据(JSON) */
  templateData?: string;
  /** 跳转链接 */
  url?: string;
  /** 发送状态(success/failed/sending) */
  status?: string;
  /** 微信消息ID */
  msgId?: string;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 发送时间 */
  sendTime?: string;
  /** 业务场景(trade/operate) */
  scene?: string;
  /** 使用的 AppId */
  wxAppId?: string;
}

/**
 * 消息发送结果
 */
export interface MessageSendResult {
  success?: boolean;
  msgId?: string;
  errorCode?: string;
  errorMsg?: string;
}

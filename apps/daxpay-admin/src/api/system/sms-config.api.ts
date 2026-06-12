import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 短信配置 API
 */
export const SmsConfigApi = {
  /**
   * 获取所有短信配置
   */
  list(): Promise<Result<SmsConfig[]>> {
    return defHttp.get({ url: '/platform/config/sms/list' });
  },
  /**
   * 获取短信配置详情
   */
  findById(id: string): Promise<Result<SmsConfig>> {
    return defHttp.get({ url: '/platform/config/sms/get', params: { id } });
  },
  /**
   * 添加短信配置
   */
  add(data: SmsConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/sms/add', data });
  },
  /**
   * 更新短信配置
   */
  update(data: SmsConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/sms/update', data });
  },
  /**
   * 删除短信配置
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/sms/delete', params: { id } });
  },
  /**
   * 启用短信配置
   */
  enable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/sms/enable', params: { id } });
  },
  /**
   * 禁用短信配置
   */
  disable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/sms/disable', params: { id } });
  },
};

/**
 * 短信配置
 */
export interface SmsConfig {
  /** 主键ID */
  id?: string;
  /** 配置名称 */
  configName?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 服务商 */
  provider?: string;
  /** 模板ID */
  templateId?: string;
  /** 签名 */
  signature?: string;
  /** 访问密钥 */
  accessKey?: string;
  /** 私有密钥 */
  secretKey?: string;
  /** 注册模板ID */
  registerId?: string;
  /** 忘记密码模板ID */
  forgetId?: string;
  /** 验证码模板ID */
  captchaId?: string;
  /** 通知模板ID */
  noticeId?: string;
}

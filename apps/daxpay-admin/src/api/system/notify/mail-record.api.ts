import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 邮件通知 API
 */
export const MailRecordApi = {
  /**
   * 邮件发送记录分页查询
   */
  page(params: any): Promise<Result<PageResult<MailRecord>>> {
    return defHttp.get({ url: '/notify/mail/page', params });
  },
  /**
   * 邮件发送记录详情
   */
  findById(id: string): Promise<Result<MailRecord>> {
    return defHttp.get({ url: '/notify/mail/get', params: { id } });
  },
  /**
   * 删除邮件发送记录
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/mail/delete', params: { id } });
  },
  /**
   * 失败邮件重发
   */
  resend(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/mail/resend', params: { id } });
  },
  /**
   * 发送测试邮件(使用库中已保存的发件箱配置)
   */
  testSend(data: MailTestSendParam): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/mail/test-send', data });
  },
};

/**
 * 邮件测试发送参数
 */
export interface MailTestSendParam {
  /** 测试收件邮箱 */
  receiverEmail?: string;
  /** 邮件主题(为空使用默认) */
  subject?: string;
}

/**
 * 邮件发送记录
 */
export interface MailRecord extends BaseEntity {
  /** 收件邮箱 */
  receiverEmail?: string;
  /** 收件用户ID */
  receiverUserId?: string;
  /** 邮件主题 */
  subject?: string;
  /** 邮件正文(HTML) */
  content?: string;
  /** 业务场景(test/manual) */
  businessType?: string;
  /** 发送状态(sending/success/fail) */
  status?: string;
  /** 失败原因 */
  errorMsg?: string;
  /** 重试次数 */
  retryCount?: number;
  /** 实际发送时间 */
  sendTime?: string;
}

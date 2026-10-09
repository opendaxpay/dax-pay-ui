import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 邮件模板 API(六个固定场景 × 中英两语言, 槽位覆盖出厂默认)
 */
export const MailTemplateApi = {
  /**
   * 模板列表(场景枚举序, 中英两语言各自合并库覆盖为当前生效值)
   */
  list(): Promise<Result<MailTemplate[]>> {
    return defHttp.get({ url: '/notify/mail-template/list' });
  },
  /**
   * 保存模板槽位覆盖(指定场景与语言)
   */
  update(data: MailTemplateSaveParam): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/mail-template/update', data });
  },
  /**
   * 恢复模板默认文案(指定场景与语言)
   */
  reset(templateCode: string, language: string): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/mail-template/reset', params: { templateCode, language } });
  },
  /**
   * 预览渲染(指定语言, 空槽位以当前生效值补齐, 示例变量值渲染)
   */
  preview(data: MailTemplatePreviewParam): Promise<Result<MailPreview>> {
    return defHttp.post({ url: '/notify/mail-template/preview', data });
  },
  /**
   * 发送模板预览邮件到指定邮箱
   */
  sendTest(data: MailTemplateSendTestParam): Promise<Result<void>> {
    return defHttp.post({ url: '/notify/mail-template/send-test', data });
  },
};

/**
 * 模板可用变量
 */
export interface MailTemplateVariable {
  /** 变量名(占位符书写形式 {变量名}) */
  name?: string;
  /** 变量说明 */
  desc?: string;
}

/**
 * 单语言槽位块(当前生效值 + 出厂默认)
 */
export interface MailSlotBlock {
  /** 语言(zh/en) */
  language?: string;
  /** 该语言是否已自定义覆盖 */
  customized?: boolean;
  /** 邮件主题(当前生效值) */
  subject?: string;
  /** 邮件标题(当前生效值) */
  title?: string;
  /** 正文文案(当前生效值) */
  content?: string;
  /** 提示行文案(当前生效值) */
  tip?: string;
  /** 页脚文案(当前生效值) */
  footer?: string;
  /** 出厂默认主题(编辑时"填入默认值"用) */
  defaultSubject?: string;
  /** 出厂默认标题 */
  defaultTitle?: string;
  /** 出厂默认正文 */
  defaultContent?: string;
  /** 出厂默认提示行 */
  defaultTip?: string;
  /** 出厂默认页脚 */
  defaultFooter?: string;
}

/**
 * 邮件模板(列表行, 中英两语言各自的生效值)
 */
export interface MailTemplate {
  /** 模板编码 */
  templateCode?: string;
  /** 场景名 */
  name?: string;
  /** 可用变量声明 */
  variables?: MailTemplateVariable[];
  /** 中文槽位 */
  zh?: MailSlotBlock;
  /** 英文槽位 */
  en?: MailSlotBlock;
}

/**
 * 模板槽位保存参数(作用于一处场景的一种语言)
 */
export interface MailTemplateSaveParam {
  /** 模板编码 */
  templateCode?: string;
  /** 语言(zh/en) */
  language?: string;
  /** 邮件主题 */
  subject?: string;
  /** 邮件标题 */
  title?: string;
  /** 正文文案 */
  content?: string;
  /** 提示行文案 */
  tip?: string;
  /** 页脚文案 */
  footer?: string;
}

/**
 * 模板预览参数(槽位可空, 空以当前生效值补齐)
 */
export type MailTemplatePreviewParam = MailTemplateSaveParam;

/**
 * 模板测试发送参数
 */
export interface MailTemplateSendTestParam extends MailTemplatePreviewParam {
  /** 测试收件邮箱 */
  receiverEmail?: string;
}

/**
 * 模板预览渲染结果
 */
export interface MailPreview {
  /** 渲染后的邮件主题 */
  subject?: string;
  /** 渲染后的邮件正文(完整 HTML) */
  html?: string;
}

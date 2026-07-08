/**
 * 社交平台编码枚举(与后端 SocialSource.name 保持一致)
 */
export enum SocialSourceEnum {
  /** 微信开放平台 */
  WE_CHAT = 'weChat',
  /** 企业微信 */
  WE_COM = 'weCom',
  /** QQ */
  QQ = 'qq',
  /** GitHub */
  GITHUB = 'github',
  /** Gitee */
  GITEE = 'gitee',
  /** Google */
  GOOGLE = 'google',
  /** 飞书 */
  FEISHU = 'feishu',
  /** 钉钉 */
  DING_TALK = 'dingTalk',
  /** 抖音 */
  DOUYIN = 'douyin',
}

/**
 * 社交平台默认名称映射
 */
export const socialNameMap: Record<string, string> = {
  [SocialSourceEnum.WE_CHAT]: '微信开放平台',
  [SocialSourceEnum.WE_COM]: '企业微信',
  [SocialSourceEnum.QQ]: 'QQ',
  [SocialSourceEnum.GITHUB]: 'GitHub',
  [SocialSourceEnum.GITEE]: 'Gitee',
  [SocialSourceEnum.GOOGLE]: 'Google',
  [SocialSourceEnum.FEISHU]: '飞书',
  [SocialSourceEnum.DING_TALK]: '钉钉',
  [SocialSourceEnum.DOUYIN]: '抖音',
};

/**
 * 社交平台品牌色映射(用于 fallback 占位块背景)
 */
export const socialColorMap: Record<string, string> = {
  [SocialSourceEnum.WE_CHAT]: '#07c160',
  [SocialSourceEnum.WE_COM]: '#2f90ff',
  [SocialSourceEnum.QQ]: '#12b7f5',
  [SocialSourceEnum.GITHUB]: '#181717',
  [SocialSourceEnum.GITEE]: '#c71d23',
  [SocialSourceEnum.GOOGLE]: '#4285F4',
  [SocialSourceEnum.FEISHU]: '#3370ff',
  [SocialSourceEnum.DING_TALK]: '#1677ff',
  [SocialSourceEnum.DOUYIN]: '#000000',
};

/**
 * 社交平台 Logo 文件映射
 * key 为平台编码(source), value 为 assets/social/目录下的 SVG 文件名(不含扩展名)
 */
export const socialLogoMap: Record<string, string> = {
  [SocialSourceEnum.WE_CHAT]: 'weChat',
  [SocialSourceEnum.WE_COM]: 'weCom',
  [SocialSourceEnum.QQ]: 'qq',
  [SocialSourceEnum.GITHUB]: 'github',
  [SocialSourceEnum.GITEE]: 'gitee',
  [SocialSourceEnum.GOOGLE]: 'google',
  [SocialSourceEnum.FEISHU]: 'feishu',
  [SocialSourceEnum.DING_TALK]: 'dingTalk',
  [SocialSourceEnum.DOUYIN]: 'douyin',
};

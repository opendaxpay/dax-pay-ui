/**
 * 应用内社交自动登录辅助
 *
 * 仅在飞书 / 微信 / 企微内置浏览器中，且本端配置开启时触发。
 * 未绑定回退时写 skipped，避免死循环。
 */

/** 本次会话已跳过自动登录(未绑定或授权失败后) */
export const AUTO_SOCIAL_SKIPPED_KEY = 'daxpay_auto_social_skipped';

/** 正在进行自动登录尝试(供 oauth-callback 静默处理) */
export const AUTO_SOCIAL_ATTEMPT_KEY = 'daxpay_auto_social_attempt';

/**
 * 当前 UA 是否匹配指定社交平台的内置浏览器
 */
export function isInAppForSource(source: string, userAgent: string = navigator.userAgent): boolean {
  const ua = userAgent || '';
  switch (source) {
    case 'weChat':
      // 微信内置浏览器, 排除企业微信
      return /MicroMessenger/i.test(ua) && !/wxwork/i.test(ua);
    case 'weCom':
      return /wxwork/i.test(ua);
    case 'feishu':
      return /Lark|Feishu|LarkLocale/i.test(ua);
    default:
      return false;
  }
}

/**
 * 标记本次为自动登录尝试
 */
export function markAutoSocialAttempt(): void {
  sessionStorage.setItem(AUTO_SOCIAL_ATTEMPT_KEY, '1');
}

/**
 * 是否处于自动登录尝试中(读后不清除, 由 consume 清除)
 */
export function isAutoSocialAttempt(): boolean {
  return sessionStorage.getItem(AUTO_SOCIAL_ATTEMPT_KEY) === '1';
}

/**
 * 消费自动登录尝试标记
 */
export function consumeAutoSocialAttempt(): boolean {
  const hit = isAutoSocialAttempt();
  sessionStorage.removeItem(AUTO_SOCIAL_ATTEMPT_KEY);
  return hit;
}

/**
 * 本会话是否已跳过自动登录
 */
export function isAutoSocialSkipped(): boolean {
  return sessionStorage.getItem(AUTO_SOCIAL_SKIPPED_KEY) === '1';
}

/**
 * 标记跳过自动登录(防循环)
 */
export function markAutoSocialSkipped(): void {
  sessionStorage.setItem(AUTO_SOCIAL_SKIPPED_KEY, '1');
  sessionStorage.removeItem(AUTO_SOCIAL_ATTEMPT_KEY);
}

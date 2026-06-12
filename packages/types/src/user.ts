import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /** 用户描述 */
  desc?: string;
  /** 访问令牌 */
  token?: string;
}

export type { UserInfo };

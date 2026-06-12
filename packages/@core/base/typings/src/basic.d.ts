interface BasicOption {
  label: string;
  value: string;
}

type SelectOption = BasicOption;

type TabOption = BasicOption;

interface BasicUserInfo {
  /** 账号 */
  account: string;
  /** 头像 */
  avatar: string;
  /** 用户ID */
  id: string;
  /** 名称 */
  name: string;
}

type ClassType =
  | Array<ClassType>
  | boolean
  | null
  | object
  | string
  | undefined;

export type { BasicOption, BasicUserInfo, ClassType, SelectOption, TabOption };

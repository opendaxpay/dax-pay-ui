import type { Result } from '../../types/web';

/** 快捷入口元信息 */
export interface QuickEntryMeta {
  /** 图标背景色（Tailwind 颜色类） */
  color: string;
  /** 默认排序（升序） */
  defaultOrder: number;
  /** 默认是否显示（首次访问 / 重置用） */
  defaultVisible: boolean;
  /** 图标（lucide 图标名） */
  icon: string;
  /** 入口唯一 key（与后端 entries 数组元素一致，两端复用） */
  key: string;
  /** 所需权限码（任一即可；空数组表示登录即可访问） */
  perms: string[];
  /** 跳转路由 name */
  routeName: string;
  /** 标题国际化 key */
  titleKey: string;
}

/** 快捷入口偏好查询结果 */
export interface QuickEntryResult {
  /** 已选入口有序序列(纯 key 数组), null 表示用户尚未自定义 */
  entries: null | string[];
}

/** 快捷入口保存参数 */
export interface QuickEntrySaveParam {
  entries: string[];
}

/** 快捷入口偏好 API 最小契约（由各端 api 模块注入，满足结构即可） */
export interface QuickEntryPreferenceApi {
  /** 查询当前用户的快捷入口序列 */
  get(): Promise<Result<QuickEntryResult>>;
  /** 保存当前用户的快捷入口序列(整体覆盖) */
  save(data: QuickEntrySaveParam): Promise<Result<void>>;
}

/** 快捷入口偏好 Store 实例结构（由 createQuickEntryStore 创建，pinia store 满足即可） */
export interface QuickEntryStore {
  /** 当前用户已选入口有序序列(纯 key 数组), null 表示未加载或未自定义 */
  entries: null | string[];
  /** 从后端加载当前用户偏好 */
  load(force?: boolean): Promise<null | string[]>;
  /** 是否已加载过(避免重复请求) */
  loaded: boolean;
  /** 是否加载中 */
  loading: boolean;
  /** 保存(整体覆盖)并更新本地缓存 */
  save(entries: string[]): Promise<void>;
}

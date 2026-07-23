import { PermCodes } from '#/constants/perm-codes';

/** 快捷入口元信息 */
export interface QuickEntryMeta {
  /** 入口唯一 key（与后端 entries 数组元素一致，两端复用） */
  key: string;
  /** 跳转路由 name */
  routeName: string;
  /** 图标（lucide 图标名） */
  icon: string;
  /** 标题国际化 key */
  titleKey: string;
  /** 图标背景色（Tailwind 颜色类） */
  color: string;
  /** 所需权限码（任一即可） */
  perms: string[];
  /** 默认是否显示（首次访问 / 重置用） */
  defaultVisible: boolean;
  /** 默认排序（升序） */
  defaultOrder: number;
}

/**
 * 快捷入口目录（Web 商户端）
 *
 * 单一事实源：所有可用入口在此声明，widget 与编辑抽屉共用
 */
export const ENTRY_CATALOG: QuickEntryMeta[] = [
  {
    key: 'profile',
    routeName: 'Profile',
    icon: 'lucide:user-round',
    titleKey: 'dashboard.workspace.quickEntry.profile',
    color: 'bg-blue-500',
    perms: [],
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    key: 'notify',
    routeName: 'NotifyCenter',
    icon: 'lucide:bell',
    titleKey: 'dashboard.workspace.quickEntry.notify',
    color: 'bg-amber-500',
    perms: [PermCodes.System.Notify.VIEW],
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    key: 'analytics',
    routeName: '/analytics',
    icon: 'lucide:area-chart',
    titleKey: 'dashboard.workspace.quickEntry.analytics',
    color: 'bg-indigo-400',
    perms: [],
    defaultVisible: true,
    defaultOrder: 3,
  },
];

/** 默认序列：defaultVisible=true 的按 defaultOrder 升序 */
export const DEFAULT_ENTRIES: string[] = ENTRY_CATALOG.filter(
  (e) => e.defaultVisible,
)
  .sort((a, b) => a.defaultOrder - b.defaultOrder)
  .map((e) => e.key);

/**
 * 按权限过滤可选入口池
 *
 * 仅返回当前用户有权限访问的入口（按 defaultOrder 升序）
 * 用于编辑抽屉的"可选池"
 *
 * @param hasPermission 权限判断函数（来自 usePermission）
 */
export function getAvailableEntries(
  hasPermission: (code: string) => boolean,
): QuickEntryMeta[] {
  return ENTRY_CATALOG.filter((e) => e.perms.length === 0 || e.perms.some((p) => hasPermission(p))).sort(
    (a, b) => a.defaultOrder - b.defaultOrder,
  );
}

/**
 * 按 key 批量还原入口元信息
 *
 * 过滤掉 catalog 中已不存在的脏数据（如旧配置残留的失效 key）
 */
export function resolveEntries(keys: string[]): QuickEntryMeta[] {
  return keys
    .map((k) => ENTRY_CATALOG.find((e) => e.key === k))
    .filter((v): v is QuickEntryMeta => !!v);
}

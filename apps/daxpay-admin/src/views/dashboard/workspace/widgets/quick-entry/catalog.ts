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
 * 快捷入口目录（Web 运营端）
 *
 * 单一事实源：所有可用入口在此声明，widget 与编辑抽屉共用
 * 新增入口只需在此数组追加一项
 */
export const ENTRY_CATALOG: QuickEntryMeta[] = [
  {
    key: 'merchant',
    routeName: 'MerchantList',
    icon: 'lucide:shopping-bag',
    titleKey: 'dashboard.workspace.quickEntry.merchant',
    color: 'bg-blue-500',
    perms: [PermCodes.Merchant.Info.VIEW],
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    key: 'app',
    routeName: 'MchAppInfoList',
    icon: 'lucide:app-window',
    titleKey: 'dashboard.workspace.quickEntry.app',
    color: 'bg-emerald-500',
    perms: [PermCodes.Merchant.App.VIEW],
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    key: 'channelMerchant',
    routeName: 'ChannelMerchantList',
    icon: 'lucide:plug',
    titleKey: 'dashboard.workspace.quickEntry.channelMerchant',
    color: 'bg-violet-500',
    perms: [PermCodes.Channel.Merchant.VIEW],
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    key: 'notify',
    routeName: 'NotifyCenter',
    icon: 'lucide:bell',
    titleKey: 'dashboard.workspace.quickEntry.notify',
    color: 'bg-amber-500',
    perms: [PermCodes.System.Notify.VIEW],
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    key: 'user',
    routeName: 'UserList',
    icon: 'lucide:users-round',
    titleKey: 'dashboard.workspace.quickEntry.user',
    color: 'bg-rose-500',
    perms: [PermCodes.Iam.UserManager.VIEW],
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    key: 'dict',
    routeName: 'SystemDict',
    icon: 'lucide:book-open',
    titleKey: 'dashboard.workspace.quickEntry.dict',
    color: 'bg-cyan-500',
    perms: [PermCodes.System.Dict.VIEW],
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    key: 'loginLog',
    routeName: 'SystemLoginLog',
    icon: 'lucide:log-in',
    titleKey: 'dashboard.workspace.quickEntry.loginLog',
    color: 'bg-slate-500',
    perms: [PermCodes.System.Log.Login.VIEW],
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    key: 'security',
    routeName: 'SecurityConfig',
    icon: 'lucide:shield-check',
    titleKey: 'dashboard.workspace.quickEntry.security',
    color: 'bg-indigo-500',
    perms: [PermCodes.System.SecurityConfig.VIEW],
    defaultVisible: true,
    defaultOrder: 8,
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
  return ENTRY_CATALOG.filter((e) => e.perms.some((p) => hasPermission(p))).sort(
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

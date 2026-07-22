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
 *
 * 注意：routeName 必须等于后端菜单的 path 字段（前端 menu.api.ts 中 name = menu.path），
 * 而非菜单的 name 字段或组件文件名。NotifyCenter 为前端 core.ts 硬编码路由，保留原 name。
 */
export const ENTRY_CATALOG: QuickEntryMeta[] = [
  {
    key: 'merchant',
    routeName: '/payment/merchant/info',
    icon: 'lucide:shopping-bag',
    titleKey: 'dashboard.workspace.quickEntry.merchant',
    color: 'bg-blue-500',
    perms: [PermCodes.Merchant.Info.VIEW],
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    key: 'app',
    routeName: '/payment/merchant/app',
    icon: 'lucide:app-window',
    titleKey: 'dashboard.workspace.quickEntry.app',
    color: 'bg-emerald-500',
    perms: [PermCodes.Merchant.App.VIEW],
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    key: 'channelMerchant',
    routeName: '/payment/global/channel-merchant',
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
    routeName: '/iam/user',
    icon: 'lucide:users-round',
    titleKey: 'dashboard.workspace.quickEntry.user',
    color: 'bg-rose-500',
    perms: [PermCodes.Iam.User.VIEW],
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    key: 'dict',
    routeName: '/system/basic/dict',
    icon: 'lucide:book-open',
    titleKey: 'dashboard.workspace.quickEntry.dict',
    color: 'bg-cyan-500',
    perms: [PermCodes.System.Dict.VIEW],
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    key: 'loginLog',
    routeName: '/system/log/login',
    icon: 'lucide:log-in',
    titleKey: 'dashboard.workspace.quickEntry.loginLog',
    color: 'bg-slate-500',
    perms: [PermCodes.System.Log.Login.VIEW],
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    key: 'security',
    routeName: '/system/config/security/system',
    icon: 'lucide:shield-check',
    titleKey: 'dashboard.workspace.quickEntry.security',
    color: 'bg-indigo-500',
    perms: [PermCodes.System.SecurityConfig.VIEW],
    defaultVisible: true,
    defaultOrder: 8,
  },
  // 以下为可选扩展入口（默认不显示，用户在编辑抽屉按需添加）
  {
    key: 'payOrder',
    routeName: '/trade/pay-order/normal',
    icon: 'lucide:receipt',
    titleKey: 'dashboard.workspace.quickEntry.payOrder',
    color: 'bg-blue-600',
    perms: [PermCodes.Trade.Order.VIEW],
    defaultVisible: false,
    defaultOrder: 9,
  },
  {
    key: 'refundOrder',
    routeName: '/trade/refund-order',
    icon: 'lucide:rotate-ccw',
    titleKey: 'dashboard.workspace.quickEntry.refundOrder',
    color: 'bg-orange-500',
    perms: [PermCodes.Trade.Refund.VIEW],
    defaultVisible: false,
    defaultOrder: 10,
  },
  {
    key: 'payTrade',
    routeName: '/trade/pay-trade',
    icon: 'lucide:arrow-left-right',
    titleKey: 'dashboard.workspace.quickEntry.payTrade',
    color: 'bg-teal-500',
    perms: [PermCodes.Trade.Fund.VIEW],
    defaultVisible: false,
    defaultOrder: 11,
  },
  {
    key: 'role',
    routeName: '/iam/perm/role',
    icon: 'lucide:shield-user',
    titleKey: 'dashboard.workspace.quickEntry.role',
    color: 'bg-purple-500',
    perms: [PermCodes.Iam.Role.VIEW],
    defaultVisible: false,
    defaultOrder: 12,
  },
  {
    key: 'menu',
    routeName: '/system/basic/menu',
    icon: 'lucide:panel-top',
    titleKey: 'dashboard.workspace.quickEntry.menu',
    color: 'bg-sky-500',
    perms: [PermCodes.Iam.Menu.VIEW],
    defaultVisible: false,
    defaultOrder: 13,
  },
  {
    key: 'operateLog',
    routeName: '/system/log/operate',
    icon: 'lucide:activity',
    titleKey: 'dashboard.workspace.quickEntry.operateLog',
    color: 'bg-slate-600',
    perms: [PermCodes.System.Log.Operate.VIEW],
    defaultVisible: false,
    defaultOrder: 14,
  },
  {
    key: 'notice',
    routeName: '/system/notify/notice',
    icon: 'lucide:megaphone',
    titleKey: 'dashboard.workspace.quickEntry.notice',
    color: 'bg-amber-600',
    perms: [PermCodes.System.Notify.VIEW],
    defaultVisible: false,
    defaultOrder: 15,
  },
  {
    key: 'productConfig',
    routeName: '/payment/config/product',
    icon: 'lucide:layout-grid',
    titleKey: 'dashboard.workspace.quickEntry.productConfig',
    color: 'bg-pink-500',
    perms: [PermCodes.Payment.ProductConfig.VIEW],
    defaultVisible: false,
    defaultOrder: 16,
  },
  {
    key: 'platformConfig',
    routeName: '/system/config/platform',
    icon: 'lucide:settings',
    titleKey: 'dashboard.workspace.quickEntry.platformConfig',
    color: 'bg-gray-500',
    perms: [PermCodes.System.PlatformConfig.VIEW],
    defaultVisible: false,
    defaultOrder: 17,
  },
  {
    key: 'onlineUser',
    routeName: '/system/monitor/online',
    icon: 'lucide:users',
    titleKey: 'dashboard.workspace.quickEntry.onlineUser',
    color: 'bg-green-500',
    perms: [PermCodes.Iam.Online.VIEW],
    defaultVisible: false,
    defaultOrder: 18,
  },
  {
    key: 'analytics',
    routeName: '/analytics',
    icon: 'lucide:area-chart',
    titleKey: 'dashboard.workspace.quickEntry.analytics',
    color: 'bg-indigo-400',
    perms: [],
    defaultVisible: false,
    defaultOrder: 19,
  },
  {
    key: 'developTrade',
    routeName: '/develop/trade',
    icon: 'lucide:credit-card',
    titleKey: 'dashboard.workspace.quickEntry.developTrade',
    color: 'bg-red-500',
    perms: [PermCodes.Develop.Trade.VIEW],
    defaultVisible: false,
    defaultOrder: 20,
  },
  {
    key: 'socialLogin',
    routeName: '/system/config/third-platform/ThirdPlatform',
    icon: 'lucide:share-2',
    titleKey: 'dashboard.workspace.quickEntry.socialLogin',
    color: 'bg-fuchsia-500',
    perms: [PermCodes.Iam.Social.VIEW],
    defaultVisible: false,
    defaultOrder: 21,
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

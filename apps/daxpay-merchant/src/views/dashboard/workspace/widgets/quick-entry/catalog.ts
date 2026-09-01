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
  /** 所需权限码（任一即可；空数组表示登录即可访问） */
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
 * routeName 必须等于菜单 path（前端 name = menu.path）
 * profile / notify / analytics 均为 core 路由，无菜单权限门槛
 * 新增入口（用户/门店/码牌/终端/通道商户/域名验证）默认不显示，仅在编辑抽屉可选池提供
 */
export const ENTRY_CATALOG: QuickEntryMeta[] = [
  // ===== 常用（core 路由） =====
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
    // 通知中心为 core 硬编码路由，商户端无 system:notify 菜单权限
    perms: [],
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
  // ===== 基础管理（对齐侧栏「商户中心 → 基础管理」） =====
  {
    key: 'merchant',
    // 商户资料（菜单 path）
    routeName: '/mch/info',
    icon: 'lucide:badge-info',
    titleKey: 'dashboard.workspace.quickEntry.merchant',
    color: 'bg-sky-500',
    perms: [PermCodes.Merchant.Info.VIEW],
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    // 商户用户 — 菜单 path /mch/user
    key: 'merchantUser',
    routeName: '/mch/user',
    icon: 'lucide:users',
    titleKey: 'menu.payment.merchant.user',
    color: 'bg-cyan-500',
    perms: [PermCodes.Merchant.User.VIEW],
    defaultVisible: false,
    defaultOrder: 11,
  },
  {
    // 门店管理 — 菜单 path /mch/store
    key: 'merchantStore',
    routeName: '/mch/store',
    icon: 'lucide:store',
    titleKey: 'menu.payment.merchant.store',
    color: 'bg-orange-400',
    perms: [PermCodes.Merchant.Store.VIEW],
    defaultVisible: false,
    defaultOrder: 12,
  },
  {
    // 码牌管理 — 菜单 path /mch/qrcode
    key: 'qrcode',
    routeName: '/mch/qrcode',
    icon: 'lucide:qr-code',
    titleKey: 'menu.payment.merchant.qrcode',
    color: 'bg-fuchsia-500',
    perms: [PermCodes.Device.QrCode.VIEW],
    defaultVisible: false,
    defaultOrder: 13,
  },
  {
    // 系统终端 — 菜单 path /mch/terminal
    key: 'terminal',
    routeName: '/mch/terminal',
    icon: 'lucide:monitor',
    titleKey: 'menu.payment.merchant.terminal',
    color: 'bg-slate-500',
    perms: [PermCodes.Merchant.Terminal.VIEW],
    defaultVisible: false,
    defaultOrder: 14,
  },
  // ===== 支付配置（对齐侧栏「商户中心 → 支付配置」） =====
  {
    // 通道商户 — 菜单 path /mch/channel-merchant
    key: 'channelMerchant',
    routeName: '/mch/channel-merchant',
    icon: 'lucide:plug',
    titleKey: 'menu.payment.merchant.channelMerchant',
    color: 'bg-lime-500',
    perms: [PermCodes.Channel.Merchant.VIEW],
    defaultVisible: false,
    defaultOrder: 15,
  },
  {
    key: 'app',
    // 应用管理
    routeName: '/mch/app',
    icon: 'lucide:app-window',
    titleKey: 'dashboard.workspace.quickEntry.app',
    color: 'bg-emerald-500',
    perms: [PermCodes.Merchant.App.VIEW],
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    key: 'wxApp',
    // 微信应用 — 菜单 path /mch/wx-app
    routeName: '/mch/wx-app',
    icon: 'lucide:message-circle',
    titleKey: 'dashboard.workspace.quickEntry.wxApp',
    color: 'bg-green-500',
    perms: [PermCodes.Payment.Wx.MchApp.VIEW],
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    key: 'douyinApp',
    // 抖音应用 — 菜单 path /mch/douyin-app
    routeName: '/mch/douyin-app',
    icon: 'lucide:music-2',
    titleKey: 'dashboard.workspace.quickEntry.douyinApp',
    color: 'bg-rose-500',
    perms: [PermCodes.Payment.Douyin.MchApp.VIEW],
    defaultVisible: true,
    defaultOrder: 7,
  },
  // ===== 业务配置（对齐侧栏「商户中心 → 业务配置」） =====
  {
    key: 'credential',
    // 对接配置
    routeName: '/mch/credential',
    icon: 'lucide:key',
    titleKey: 'dashboard.workspace.quickEntry.credential',
    color: 'bg-violet-500',
    perms: [PermCodes.Merchant.Credential.VIEW],
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    // 微信域名验证 — 菜单 path /mch/wx-verify
    key: 'wxVerify',
    routeName: '/mch/wx-verify',
    icon: 'lucide:shield-check',
    titleKey: 'menu.payment.merchant.wxVerify',
    color: 'bg-indigo-500',
    perms: [PermCodes.Merchant.WxDomainVerify.VIEW],
    defaultVisible: false,
    defaultOrder: 16,
  },
  // ===== 交易与工具 =====
  {
    key: 'payTrade',
    // 支付交易 / 资金交易
    routeName: '/trade/pay-trade',
    icon: 'lucide:arrow-left-right',
    titleKey: 'dashboard.workspace.quickEntry.payTrade',
    color: 'bg-teal-500',
    perms: [PermCodes.Trade.Fund.VIEW],
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    key: 'developTrade',
    // 支付调试 — 菜单 path /develop/trade
    routeName: '/develop/trade',
    icon: 'lucide:flask-conical',
    titleKey: 'dashboard.workspace.quickEntry.developTrade',
    color: 'bg-rose-500',
    perms: [PermCodes.Develop.Trade.VIEW],
    defaultVisible: true,
    defaultOrder: 10,
  },
];

/** 默认序列：defaultVisible=true 的按 defaultOrder 升序 */
export const DEFAULT_ENTRIES: string[] = ENTRY_CATALOG.filter((e) => e.defaultVisible)
  .toSorted((a, b) => a.defaultOrder - b.defaultOrder)
  .map((e) => e.key);

/**
 * 按权限过滤可选入口池
 *
 * 仅返回当前用户有权限访问的入口（按 defaultOrder 升序）
 * 用于编辑抽屉的"可选池"
 *
 * @param hasPermission 权限判断函数（来自 usePermission）
 */
export function getAvailableEntries(hasPermission: (code: string) => boolean): QuickEntryMeta[] {
  return ENTRY_CATALOG.filter((e) => e.perms.length === 0 || e.perms.some((p) => hasPermission(p))).toSorted(
    (a, b) => a.defaultOrder - b.defaultOrder,
  );
}

/**
 * 按 key 批量还原入口元信息
 *
 * 过滤掉 catalog 中已不存在的脏数据（如旧配置残留的失效 key）
 */
export function resolveEntries(keys: string[]): QuickEntryMeta[] {
  return keys.map((k) => ENTRY_CATALOG.find((e) => e.key === k)).filter((v): v is QuickEntryMeta => !!v);
}

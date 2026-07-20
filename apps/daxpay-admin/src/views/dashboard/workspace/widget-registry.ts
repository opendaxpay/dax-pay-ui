import type { LayoutItem, WidgetMeta } from './types';

import NoticeListWidget from './widgets/notice-list.widget.vue';
import PayTradeListWidget from './widgets/pay-trade-list.widget.vue';
import ProviderDistributionWidget from './widgets/provider-distribution.widget.vue';
import QuickEntryWidget from './widgets/quick-entry.widget.vue';
import TradeOverviewWidget from './widgets/trade-overview.widget.vue';
import TradeTrendWidget from './widgets/trade-trend.widget.vue';
import WorkbenchHeaderWidget from './widgets/workbench-header.widget.vue';

/**
 * 工作台 Widget 注册表
 *
 * 单一事实源：所有可用 widget 在此声明
 * - 新增 widget：只需在此数组追加一项，主页自动渲染
 * - 未来"布局编辑器"：读取本注册表作为可选组件池
 */
export const WIDGET_REGISTRY: WidgetMeta[] = [
  {
    id: 'workbench-header',
    component: WorkbenchHeaderWidget,
    titleKey: 'dashboard.workspace.widget.workbenchHeader',
    icon: 'lucide:user',
    defaultSpan: 24,
    defaultOrder: 0,
    resizable: false,
  },
  {
    id: 'quick-entry',
    component: QuickEntryWidget,
    titleKey: 'dashboard.workspace.widget.quickEntry',
    icon: 'lucide:mouse-pointer-click',
    defaultSpan: 24,
    defaultOrder: 1,
  },
  {
    // 交易概览：左栏，三栏并排的第一栏
    id: 'trade-overview',
    component: TradeOverviewWidget,
    titleKey: 'dashboard.workspace.widget.tradeOverview',
    icon: 'lucide:wallet',
    defaultSpan: 8,
    defaultOrder: 3,
  },
  {
    // 资金交易：中栏，最近资金交易明细
    id: 'pay-trade-list',
    component: PayTradeListWidget,
    titleKey: 'dashboard.workspace.widget.payTrade',
    icon: 'lucide:arrow-left-right',
    defaultSpan: 8,
    defaultOrder: 4,
  },
  {
    // 系统公告：右栏，与交易概览、资金交易三栏并排
    id: 'notice-list',
    component: NoticeListWidget,
    titleKey: 'dashboard.workspace.widget.noticeList',
    icon: 'lucide:bell',
    defaultSpan: 8,
    defaultOrder: 5,
  },
  {
    id: 'trade-trend',
    component: TradeTrendWidget,
    titleKey: 'dashboard.workspace.widget.tradeTrend',
    icon: 'lucide:trending-up',
    defaultSpan: 16,
    defaultOrder: 7,
  },
  {
    id: 'provider-distribution',
    component: ProviderDistributionWidget,
    titleKey: 'dashboard.workspace.widget.providerDist',
    icon: 'lucide:pie-chart',
    defaultSpan: 8,
    defaultOrder: 6,
  },
];

/** Header widget 的 id（容器中单独全宽渲染，不参与栅格） */
export const HEADER_WIDGET_ID = 'workbench-header';

/**
 * 获取默认布局（除 header 外的 widget 列表）
 * 未来可改为从 localStorage / 后端用户偏好读取
 */
export function getDefaultLayout(): LayoutItem[] {
  return WIDGET_REGISTRY.filter((m) => m.id !== HEADER_WIDGET_ID)
    .map((m) => ({
      widgetId: m.id,
      span: m.defaultSpan,
      order: m.defaultOrder,
      visible: true,
    }))
    .toSorted((a, b) => a.order - b.order);
}

/** 按 id 查找 widget 元信息 */
export function getWidgetMeta(id: string): undefined | WidgetMeta {
  return WIDGET_REGISTRY.find((m) => m.id === id);
}

import type { Component } from 'vue';

/**
 * Widget 元信息
 * 用于注册表中声明每个工作台卡片组件的标识、布局与渲染信息
 * 为未来"自定义布局编辑器"预留：新增 widget 只需在此登记，主页无需改动
 */
export interface WidgetMeta {
  /** 唯一标识，如 'trade-trend' */
  id: string;
  /** widget 组件 */
  component: Component;
  /** 标题国际化 key，如 'dashboard.workspace.widget.tradeTrend' */
  titleKey: string;
  /** 图标（lucide 图标名） */
  icon: string;
  /** 默认栅格跨度（24 栅格制：6 / 8 / 12 / 16 / 24） */
  defaultSpan: number;
  /** 默认排序（升序） */
  defaultOrder: number;
  /** 是否允许调整尺寸（未来拖拽编辑器用，当前仅声明） */
  resizable?: boolean;
}

/**
 * 工作台布局项
 * 描述一个 widget 在布局中的具体呈现位置
 * 未来持久化（localStorage / 后端）的就是该结构的集合
 */
export interface LayoutItem {
  /** 对应 WidgetMeta.id */
  widgetId: string;
  /** 当前栅格跨度 */
  span: number;
  /** 当前排序 */
  order: number;
  /** 是否显示 */
  visible: boolean;
}

/**
 * 工作台聚合统计数据
 * 由 useDashboardData 统一获取，下发给各 widget
 */
export interface DashboardStats {
  /** 商户总数 */
  merchantCount: number;
  /** 通道商户数 */
  channelMerchantCount: number;
  /** 用户总数 */
  userCount: number;
}

/**
 * 工作台数据载荷（下发给 widget 的统一 props.data）
 */
export interface DashboardData {
  /** 聚合统计 */
  stats: DashboardStats;
  /** 是否加载中 */
  loading: boolean;
  /** 刷新数据 */
  refresh: () => Promise<void>;
}

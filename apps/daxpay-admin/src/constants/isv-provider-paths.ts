/**
 * Mock 模拟通道页面路径常量(单一事实源)
 *
 * 与 iam_perm_menu 的 path 列保持一致(菜单路径调整时同步此处);
 * 供服务商管理页卡片跳转、工作台返回与删除后回跳、产品配置页入口映射复用, 避免各页 path 字面量漂移。
 */
export const MockIsvPaths = {
  /** 服务商管理页(菜单 path: /payment/mock/isv) */
  MANAGE: '/payment/mock/isv',
  /** 服务商工作台子页(菜单 path: /payment/mock/isv-workbench, query.id 定位服务商) */
  WORKBENCH: '/payment/mock/isv-workbench',
} as const;

/** 模拟支付直连(mock_pay)页面路径常量 */
export const MockDirectPaths = {
  /** 直连工作台隐藏子页(菜单 path: /payment/mock/direct-workbench, 产品配置页卡片直达) */
  WORKBENCH: '/payment/mock/direct-workbench',
} as const;

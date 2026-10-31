/**
 * Mock 模拟服务商页面路径常量(单一事实源)
 *
 * 与 iam_perm_menu 的 path 列保持一致(菜单路径调整时同步此处);
 * 供服务商管理页卡片跳转、工作台返回与删除后回跳复用, 避免各页 path 字面量漂移。
 */
export const MockIsvPaths = {
  /** 服务商管理页(菜单 path: /payment/mock/isv) */
  MANAGE: '/payment/mock/isv',
  /** 服务商工作台子页(菜单 path: /payment/mock/isv-workbench, query.id 定位服务商) */
  WORKBENCH: '/payment/mock/isv-workbench',
} as const;

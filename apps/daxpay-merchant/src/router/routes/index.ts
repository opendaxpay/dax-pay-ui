import type { RouteRecordRaw } from 'vue-router';

import { traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute, notifyCenterRoute, profileRoute } from './core';

// 基本路由名称集合（coreRoutes 不含 Profile，这些路由不走权限拦截）
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

// 路由列表
const routes: RouteRecordRaw[] = [...coreRoutes, fallbackNotFoundRoute];

// 将 Profile、通知中心注入 Root children（使用 BasicLayout，走完整认证流程）
const rootRoute = routes.find((r) => r.name === 'Root');
if (rootRoute) {
  rootRoute.children = [...(rootRoute.children || []), profileRoute, notifyCenterRoute];
}

export { coreRouteNames, routes };

// 首页路径常量透传（统一引用入口，避免业务模块直接深入 core.ts）
export { HOME_PATH } from './core';
// 强制改密页路径常量透传
export { FORCE_CHANGE_PASSWORD_PATH } from './core';

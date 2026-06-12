import type { RouteRecordRaw } from 'vue-router';

import { traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

/** 路由列表，由基本路由和404兜底路由组成，无需走权限验证 */
const routes: RouteRecordRaw[] = [...coreRoutes, fallbackNotFoundRoute];

/** 基本路由列表，这些路由不需要进入权限拦截 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

export { coreRouteNames, routes };

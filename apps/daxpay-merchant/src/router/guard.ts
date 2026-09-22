import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { decodeSafeRedirect, startProgress, stopProgress } from '@vben/utils';

import { AuthApi } from '#/api/core/auth.api';
import { coreRouteNames, FORCE_CHANGE_PASSWORD_PATH, HOME_PATH } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';

const PASSWORD_STATUS_CODES = new Set([40_301, 40_302]);

/** 判断请求是否因初始密码或密码过期被后端拦截 */
function isPasswordStatusError(error: unknown): boolean {
  const requestError = error as {
    code?: number;
    data?: { code?: number };
    response?: { data?: { code?: number } };
  };
  const code = requestError.response?.data?.code ?? requestError.data?.code ?? requestError.code;
  return PASSWORD_STATUS_CODES.has(code ?? 0);
}

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        return decodeSafeRedirect(to.query?.redirect, HOME_PATH);
      }
      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          // 如不需要，直接删除 query
          query: to.fullPath === HOME_PATH ? {} : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      return true;
    }

    try {
      // 获取用户信息
      if (!userStore.userInfo) {
        await authStore.fetchUserInfo();
      }

      // 初始密码/密码过期: 强制跳改密页。
      // 此时权限码/菜单接口会被后端 PasswordStatusCheck 拦截(40301/40302), 不再请求。
      // 改密页是 coreRoute, 守卫上方已提前放行, 此处跳转不会形成循环。
      if (authStore.needChangePassword) {
        return {
          path: FORCE_CHANGE_PASSWORD_PATH,
          replace: true,
        };
      }

      // 每次刷新重新拉取权限码，保证权限变更即时生效
      const { data: permCodes } = await AuthApi.getPermCodes();
      accessStore.setPermCodes(permCodes);

      // 生成菜单和路由
      const { accessibleMenus, accessibleRoutes } = await generateAccess({
        router,
      });

      // 保存菜单信息和路由信息
      accessStore.setAccessMenus(accessibleMenus);
      accessStore.setAccessRoutes(accessibleRoutes);
      accessStore.setIsAccessChecked(true);
      const redirectPath = decodeSafeRedirect(
        from.query.redirect,
        to.path === HOME_PATH ? HOME_PATH : to.fullPath,
      );

      return {
        ...router.resolve(redirectPath),
        replace: true,
      };
    } catch (error) {
      // 密码状态拦截直接回到改密页，不进入服务不可用页
      if (isPasswordStatusError(error)) {
        return {
          path: FORCE_CHANGE_PASSWORD_PATH,
          query: { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }
      // 401 token 失效时, authenticateResponseInterceptor 已调用 doReAuthenticate 清除 token, 此时跳登录页重新登录
      if (!accessStore.accessToken) {
        return { path: LOGIN_PATH, replace: true };
      }
      // 网络错误 / 后端服务不可用: token 仍在, 跳服务不可用提示页, 保留登录态供用户手动刷新重试
      // 记下目标页，服务恢复后重试回到该页而不是首页
      // 排除自身路径，避免 redirect 指向 /service-unavailable 形成循环
      const redirectPath = to.path === '/service-unavailable' ? HOME_PATH : to.fullPath;
      return {
        path: '/service-unavailable',
        query: { redirect: encodeURIComponent(redirectPath) },
        replace: true,
      };
    }
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };

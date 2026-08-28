import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

/**
 * 首页路径常量
 * 不直接读 preferences.app.defaultHomePath：Vben 偏好合并用 defu（缓存优先），
 * 历史缓存中的旧值会覆盖代码默认值，导致根路由 redirect 与登录回跳指向错误页面
 */
export const HOME_PATH = '/workspace';

/** 强制改密页路径（初始密码/密码过期时登录后跳转, coreRoute 直接放行不依赖动态菜单） */
export const FORCE_CHANGE_PASSWORD_PATH = '/account/force-change-password';

const BasicLayout = () => import('#/layouts/basic.vue');
const AuthPageLayout = () => import('#/layouts/auth.vue');
/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 个人设置路由（需要登录，独立于 coreRoutes） */
const profileRoute: RouteRecordRaw = {
  name: 'Profile',
  path: 'profile',
  component: () => import('#/views/profile/index.vue'),
  meta: {
    // 个人设置
    title: 'page.auth.profile',
    hideInMenu: true,
    hideInBreadcrumb: true,
    activePath: '/profile',
  },
};

/** 第三方绑定回调（独立路由，弹窗模式，不使用 AuthPageLayout） */
const socialBindCallbackRoute: RouteRecordRaw = {
  name: 'SocialBindCallback',
  path: '/auth/social-bind-callback/:source?',
  component: () => import('#/views/_core/authentication/social-bind-callback.vue'),
  meta: {
    title: 'page.auth.oauthCallback',
    hideInMenu: true,
    hideInBreadcrumb: true,
    hideInTab: true,
  },
};

/** 协议展示页（独立全屏路由，不走 AuthPageLayout，免登录预览协议正文） */
const agreementTermsRoute: RouteRecordRaw = {
  name: 'AgreementTerms',
  path: '/auth/agreement/terms',
  component: () => import('#/views/_core/authentication/agreement-terms.vue'),
  meta: {
    // 用户协议
    title: 'authentication.termsTitle',
    hideInMenu: true,
  },
};

/** 隐私政策展示页（独立全屏路由，不走 AuthPageLayout，免登录预览协议正文） */
const agreementPrivacyRoute: RouteRecordRaw = {
  name: 'AgreementPrivacy',
  path: '/auth/agreement/privacy',
  component: () => import('#/views/_core/authentication/agreement-privacy.vue'),
  meta: {
    // 隐私政策
    title: 'authentication.privacyTitle',
    hideInMenu: true,
  },
};

// 服务不可用提示页（后端不可用时的兜底，独立全屏，不走权限拦截）
const serviceUnavailableRoute: RouteRecordRaw = {
  name: 'ServiceUnavailable',
  path: '/service-unavailable',
  component: () => import('#/views/_core/fallback/offline.vue'),
  meta: {
    // 服务不可用
    title: 'ui.fallback.offlineError',
    hideInMenu: true,
    hideInBreadcrumb: true,
    hideInTab: true,
  },
};

/** 强制改密页（初始密码/密码过期, 独立全屏不依赖动态菜单与 BasicLayout） */
const forceChangePasswordRoute: RouteRecordRaw = {
  name: 'ForceChangePassword',
  path: FORCE_CHANGE_PASSWORD_PATH,
  component: () => import('#/views/_core/authentication/force-change-password.vue'),
  meta: {
    // 强制修改密码
    title: '_core.authentication.forceChangePassword.title',
    hideInMenu: true,
    hideInBreadcrumb: true,
    hideInTab: true,
  },
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  /**
   * 根路由
   * 使用基础布局，作为所有页面的父级容器，子级就不必配置BasicLayout。
   * 此路由必须存在，且不应修改
   */
  {
    component: BasicLayout,
    meta: {
      hideInBreadcrumb: true,
      title: 'Root',
    },
    name: 'Root',
    path: '/',
    redirect: HOME_PATH,
    children: [],
  },
  {
    component: AuthPageLayout,
    meta: {
      hideInTab: true,
      title: 'Authentication',
    },
    name: 'Authentication',
    path: '/auth',
    redirect: LOGIN_PATH,
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('#/views/_core/authentication/login.vue'),
        meta: {
          // 登录
          title: 'page.auth.login',
        },
      },
      {
        name: 'ForgetPassword',
        path: 'forget-password',
        component: () => import('#/views/_core/authentication/forget-password.vue'),
        meta: {
          // 忘记密码(邮箱验证码找回)
          title: 'page.auth.forgetPassword',
          hideInMenu: true,
          hideInBreadcrumb: true,
          hideInTab: true,
        },
      },
      {
        name: 'QrCodeLogin',
        path: 'qrcode-login',
        component: () => import('#/views/_core/authentication/qrcode-login.vue'),
        meta: {
          // 二维码登录
          title: 'page.auth.qrcodeLogin',
        },
      },
      {
        name: 'OauthCallback',
        // source 为路径参数, 用于回调页识别平台; 可选以兼容无 source 的旧地址
        path: 'oauth-callback/:source?',
        component: () => import('#/views/_core/authentication/oauth-callback.vue'),
        meta: {
          // 第三方登录回调
          title: 'page.auth.oauthCallback',
          hideInMenu: true,
        },
      },
    ],
  },
  // 第三方绑定回调（独立路由，弹窗模式）
  socialBindCallbackRoute,
  // 协议展示页（独立全屏路由，不走 AuthPageLayout）
  agreementTermsRoute,
  agreementPrivacyRoute,
  // 服务不可用提示页（后端不可用兜底，独立全屏，不走权限拦截）
  serviceUnavailableRoute,
  // 强制改密页（初始密码/密码过期, 独立全屏）
  forceChangePasswordRoute,
];

/** 通知中心路由（需要登录，从铃铛"查看全部"进入，无菜单） */
const notifyCenterRoute: RouteRecordRaw = {
  name: 'NotifyCenter',
  path: 'notify/center',
  component: () => import('#/views/system/notify/center/NotifyCenter.vue'),
  meta: {
    // 通知中心
    title: 'system.notify.centerTitle',
    hideInMenu: true,
    hideInBreadcrumb: true,
    activePath: '/notify/center',
  },
};

export { coreRoutes, fallbackNotFoundRoute, notifyCenterRoute, profileRoute, socialBindCallbackRoute };

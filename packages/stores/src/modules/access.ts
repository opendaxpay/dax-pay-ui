import type { RouteRecordRaw } from 'vue-router';

import type { MenuRecordRaw } from '@vben-core/typings';

import { acceptHMRUpdate, defineStore } from 'pinia';

type AccessToken = null | string;

// Token存储键
const TOKEN_KEY = 'core-access-accessToken';

interface AccessState {
  /**
   * 可访问的菜单列表
   */
  accessMenus: MenuRecordRaw[];
  /**
   * 可访问的路由列表
   */
  accessRoutes: RouteRecordRaw[];
  /**
   * 登录 accessToken
   */
  accessToken: AccessToken;
  /**
   * 是否已经检查过权限
   */
  isAccessChecked: boolean;
  /**
   * 是否锁屏状态
   */
  isLockScreen: boolean;
  /**
   * 锁屏密码
   */
  lockScreenPassword?: string;
  /**
   * 登录是否过期
   */
  loginExpired: boolean;
  /**
   * 权限码
   */
  permCodes: string[];
  /**
   * 登录 accessToken
   */
  refreshToken: AccessToken;
}

/**
 * 从存储加载Token
 */
function loadTokenFromStorage(): AccessToken {
  // 优先从sessionStorage读取（不记住我模式）
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) {
    return sessionToken;
  }
  // 其次从localStorage读取（记住我模式）
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) {
    return localToken;
  }
  return null;
}

/**
 * @zh_CN 访问权限相关
 */
export const useAccessStore = defineStore('core-access', {
  actions: {
    getMenuByPath(path: string) {
      function findMenu(menus: MenuRecordRaw[], path: string): MenuRecordRaw | undefined {
        for (const menu of menus) {
          if (menu.path === path) {
            return menu;
          }
          if (menu.children) {
            const matched = findMenu(menu.children, path);
            if (matched) {
              return matched;
            }
          }
        }
      }
      return findMenu(this.accessMenus, path);
    },
    lockScreen(password: string) {
      this.isLockScreen = true;
      this.lockScreenPassword = password;
    },
    setPermCodes(codes: string[]) {
      this.permCodes = codes;
    },
    setAccessMenus(menus: MenuRecordRaw[]) {
      this.accessMenus = menus;
    },
    setAccessRoutes(routes: RouteRecordRaw[]) {
      this.accessRoutes = routes;
    },
    setAccessToken(token: AccessToken, remember: boolean = true) {
      this.accessToken = token;
      if (token) {
        this.saveTokenToStorage(token, remember);
      } else {
        this.clearTokenFromStorage();
      }
    },
    /**
     * 保存Token到存储
     * @param token Token值
     * @param remember 是否记住我
     */
    saveTokenToStorage(token: string, remember: boolean) {
      // 先清除两个存储中的旧Token
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      if (remember) {
        // 记住我：存入localStorage，持久化
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        // 不记住我：存入sessionStorage，会话级
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    },
    /**
     * 清除Token存储
     */
    clearTokenFromStorage() {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    },
    setIsAccessChecked(isAccessChecked: boolean) {
      this.isAccessChecked = isAccessChecked;
    },
    setLoginExpired(loginExpired: boolean) {
      this.loginExpired = loginExpired;
    },
    setRefreshToken(token: AccessToken) {
      this.refreshToken = token;
    },
    unlockScreen() {
      this.isLockScreen = false;
      this.lockScreenPassword = undefined;
    },
  },
  persist: {
    // 持久化（accessToken改为手动管理，根据remember选择存储方式）
    pick: ['refreshToken', 'isLockScreen', 'lockScreenPassword'],
  },
  state: (): AccessState => ({
    permCodes: [],
    accessMenus: [],
    accessRoutes: [],
    // 初始化时从存储加载Token
    accessToken: loadTokenFromStorage(),
    isAccessChecked: false,
    isLockScreen: false,
    lockScreenPassword: undefined,
    loginExpired: false,
    refreshToken: null,
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAccessStore, hot));
}

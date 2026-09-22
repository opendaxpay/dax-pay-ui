import type { App } from 'vue';

import { formatDate, formatDateTime } from '@vben/utils';

// vxe 宿主应用: bootstrap 在 app.mount 前绑定, ensureVxe 注册组件时使用
// (mount 后再 app.use 注册的全局组件, 对之后新渲染的路由组件照常生效)
let hostApp: App | null = null;

// vxe 加载态(幂等: 首次调用后复用同一 Promise)
let vxeLoading: null | Promise<void> = null;

// 暗黑状态: vxe 未注册前仅记录, 注册完成时由 ensureVxe 应用一次, 主题切换不丢
let darkMode = false;

// vxe-table 默认导出(VXETable)引用, 注册完成后 setDark 直接生效
let vxeCore: (typeof import('vxe-table'))['default'] | null = null;

/**
 * 绑定应用宿主, 供 ensureVxe 注册 vxe 组件(两端 bootstrap 在 app.mount 前调用)
 */
export function bindVxeApp(app: App): void {
  hostApp = app;
}

/**
 * 同步 vxe 暗黑主题
 * vxe 尚未注册时仅记录状态, 由 ensureVxe 加载完成后统一应用
 */
export function setDark(dark: boolean): void {
  darkMode = dark;
  if (vxeCore) {
    vxeCore.setTheme(dark ? 'dark' : 'light');
  }
}

/**
 * 按需加载并注册 vxe-table / vxe-pc-ui
 * 登录页不渲染 vxe, 由两端路由守卫在首个鉴权导航前调用, 首屏不再加载 2.6MB JS + 577KB CSS;
 * 组件注册顺序与样式/语言包/全局配置/日期格式化器与原先 bootstrap 静态注册完全一致
 */
export function ensureVxe(): Promise<void> {
  if (vxeLoading) {
    return vxeLoading;
  }
  vxeLoading = (async () => {
    if (!hostApp) {
      throw new Error('[vxe] bindVxeApp 未在 app.mount 前调用, 无法注册 vxe 组件');
    }
    // vxe 运行时 + 语言包/全局配置模块并行加载
    const [vxeTableMod, vxePcUiMod, configMod] = await Promise.all([
      import('vxe-table'),
      import('vxe-pc-ui'),
      import('./vxe-table'),
    ]);
    // 基础库样式随注册一起动态加载(构建器拆为运行时注入的样式块, 不再打进入口 CSS)
    await Promise.all([import('vxe-pc-ui/lib/style.css'), import('vxe-table/lib/style.css')]);

    // 注册顺序保持与原 bootstrap 一致: 先 vxe-table 再 vxe-pc-ui
    hostApp.use(vxeTableMod.default);
    hostApp.use(vxePcUiMod.default);

    // 语言包 + 全局默认配置(原 vxe-table.ts 顶层副作用显式化)
    configMod.setupVxeConfig();

    // 注册全局 vxe-table 日期格式化器, 使列 formatter="formatDateTime" 生效
    vxePcUiMod.default.formats.add('formatDate', {
      tableCellFormatMethod({ cellValue }) {
        return formatDate(cellValue);
      },
    });
    vxePcUiMod.default.formats.add('formatDateTime', {
      tableCellFormatMethod({ cellValue }) {
        return formatDateTime(cellValue);
      },
    });

    // 应用挂起的暗黑状态, 后续 setDark 直接生效
    vxeCore = vxeTableMod.default;
    setDark(darkMode);
  })();
  return vxeLoading;
}

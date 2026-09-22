import { createApp, watchEffect } from 'vue';

import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { addCollection } from '@vben/icons';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/antdv-next';

import { initComponentAdapter } from '@daxpay/ui-biz/adapter/component';
import { bindVxeApp, setDark } from '@daxpay/ui-biz/adapter/component/vxe-table/register';
import { initSetupVbenForm } from '@daxpay/ui-biz/adapter/form';
import { ensureBrandIcons } from '@daxpay/ui-biz/components/icon-picker/icons';
import lucide from '@iconify/json/json/lucide.json';
import { useTitle } from '@vueuse/core';
import Antd from 'antdv-next';

import { $t, setupI18n } from '#/locales';

import App from './app.vue';
import { router } from './router';

// vxe 项目自定义覆盖样式(全部带 !important, 与延后加载的 vxe 基础样式顺序无关);
// vxe 基础库样式(JS/CSS)已延后到鉴权导航前动态加载, 见 register.ts 的 ensureVxe
import '@daxpay/ui-biz/adapter/component/vxe-table/style';

// 项目公共样式入口
import '#/styles/index.less';

/**
 * 品牌图标集(simple-icons, 4.55MB)后台预取
 * 等 load 事件(首屏资源加载完成)后的浏览器空闲时机再拉, 避免挤占首屏带宽;
 * timeout 兜底: 后台标签页/持续繁忙时空闲回调可能长期不调度, 3 秒后强制拉取
 * 失败静默(ensureBrandIcons 内部允许重试), 图标选择器打开时会兜底再触发
 */
function prefetchBrandIcons() {
  const start = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          void ensureBrandIcons();
        },
        { timeout: 3000 },
      );
    } else {
      void ensureBrandIcons();
    }
  };
  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
  }
}

async function bootstrap(namespace: string) {
  // 预加载通用图标集到内存: lucide(菜单图标主力, 首帧依赖), 使菜单图标可离线渲染;
  // 品牌图标集(simple-icons)仅供图标选择器候选, 已移出首屏, 由 prefetchBrandIcons 空闲期后台加载
  addCollection(lucide);

  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  const app = createApp(App);

  // 注册 Antd Next
  app.use(Antd);

  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading', // 在这里可以自定义指令名称，也可以明确提供false表示不注册这个指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });

  // 拉取站点品牌配置(系统名/Logo/备案), 失败不阻断启动
  const { initWebsiteConfig } = await import('./logics/init-website-config');
  await initWebsiteConfig();

  // 初始化 tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // 配置Motion插件
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle = (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  // 监听主题变化，同步 VxeTable 暗黑模式
  // vxe 已延后到鉴权导航前注册(见 register.ts), 未注册期间仅记录状态、注册后自动应用
  watchEffect(() => {
    setDark(preferences.theme.mode === 'dark');
  });

  // 绑定 vxe 注册宿主(须在 mount 前绑定, 首个鉴权导航前由守卫调用 ensureVxe 完成注册)
  bindVxeApp(app);

  app.mount('#app');

  // 品牌图标集空闲期后台预取
  prefetchBrandIcons();
}

export { bootstrap };

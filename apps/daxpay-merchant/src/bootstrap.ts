import { createApp, watchEffect } from 'vue';

import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { addCollection } from '@vben/icons';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/antdv-next';

import { initComponentAdapter } from '@daxpay/ui-biz/adapter/component';
import { registerVxeComponents, setDark } from '@daxpay/ui-biz/adapter/component/vxe-table';
import { initSetupVbenForm } from '@daxpay/ui-biz/adapter/form';
import lucide from '@iconify/json/json/lucide.json';
import { useTitle } from '@vueuse/core';
import Antd from 'antdv-next';

import { $t, setupI18n } from '#/locales';

import App from './app.vue';
import { router } from './router';

import '@daxpay/ui-biz/adapter/component/vxe-table/style';

// vxe 样式: 基础库样式 + 项目自定义样式
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
// 项目公共样式入口
import '#/styles/index.less';

async function bootstrap(namespace: string) {
  // 预加载通用图标集到内存: lucide(菜单图标主力, 首帧依赖), 使菜单图标可离线渲染;
  // 品牌图标集(simple-icons, 4.55MB)仅供图标选择器候选, 已移出首屏, 由选择器打开时按需加载(见 icon-picker/icons.ts)
  addCollection(lucide);

  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  const app = createApp(App);

  // 注册 Antd Next
  app.use(Antd);

  // 按需注册 vxe 组件(具名导入+构建期按组件拆分, 不再整包 app.use, vxe 全量 2.6MB 移出首屏)
  registerVxeComponents(app);

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
  watchEffect(() => {
    setDark(preferences.theme.mode === 'dark');
  });

  app.mount('#app');
}

export { bootstrap };

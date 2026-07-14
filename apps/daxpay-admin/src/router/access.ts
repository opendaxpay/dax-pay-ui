import type { Router } from 'vue-router';

import type { ComponentRecordType } from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { convertMenuListToRoutes, getAllMenusApi, injectMenuI18n } from '#/api';
import { useMessage } from '#/hooks/useMessage';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

interface GenerateAccessOptions {
  router: Router;
}

async function generateAccess(options: GenerateAccessOptions) {
  const { router } = options;

  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    router,
    routes: [],
    fetchMenuListAsync: async () => {
      const { message } = useMessage();
      // 正在加载菜单
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      const { data: menus } = await getAllMenusApi();
      // 注入菜单标题国际化文案（数据源为静态语言包）
      injectMenuI18n();
      return convertMenuListToRoutes(menus);
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };

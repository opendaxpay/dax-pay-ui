import type { App } from 'vue';

import { defineComponent } from 'vue';

import { formatDate, formatDateTime } from '@vben/utils';

import {
  VxeButton,
  VxeCheckbox,
  VxeIcon,
  VxeInput,
  VxeLoading,
  VxeModal,
  VxeNumberInput,
  VxePager,
  VxeRadioGroup,
  VxeSelect,
  VxeTooltip,
  VxeUI,
  VxeUpload,
} from 'vxe-pc-ui';
import enUS from 'vxe-pc-ui/lib/language/en-US';
import idID from 'vxe-pc-ui/lib/language/id-ID';
import jaJP from 'vxe-pc-ui/lib/language/ja-JP';
import koKR from 'vxe-pc-ui/lib/language/ko-KR';
import msMY from 'vxe-pc-ui/lib/language/ms-MY';
import thTH from 'vxe-pc-ui/lib/language/th-TH';
import viVN from 'vxe-pc-ui/lib/language/vi-VN';
import zhCN from 'vxe-pc-ui/lib/language/zh-CN';
import zhHK from 'vxe-pc-ui/lib/language/zh-HK';
import zhTW from 'vxe-pc-ui/lib/language/zh-TW';
import { VxeColgroup, VxeColumn, VxeTable, VxeToolbar } from 'vxe-table';

// 国际化配置
// 不知道为什么, 必须添加default之后才能正常使用
VxeUI.setI18n('en-US', enUS.default);
VxeUI.setI18n('zh-CN', zhCN.default);
VxeUI.setI18n('zh-TW', zhTW.default);
VxeUI.setI18n('zh-HK', zhHK.default);
VxeUI.setI18n('ja-JP', jaJP.default);
VxeUI.setI18n('ko-KR', koKR.default);
VxeUI.setI18n('id-ID', idID.default);
VxeUI.setI18n('vi-VN', viVN.default);
VxeUI.setI18n('th-TH', thTH.default);
VxeUI.setI18n('ms-MY', msMY.default);

// 注册全局 vxe-table 日期格式化器, 使列 formatter="formatDateTime" 生效
// (原在两端 bootstrap 注册, 收敛到本模块随导入生效)
VxeUI.formats.add('formatDate', {
  tableCellFormatMethod({ cellValue }) {
    return formatDate(cellValue);
  },
});
VxeUI.formats.add('formatDateTime', {
  tableCellFormatMethod({ cellValue }) {
    return formatDateTime(cellValue);
  },
});

/**
 * 是否设置暗黑模式
 * @param dark
 */
export function setDark(dark: boolean) {
  VxeUI.setTheme(dark ? 'dark' : 'light');
}

/**
 * 配置(原 VXETable.setConfig, v4 中全局配置 API 与 VxeUI 同源)
 */
VxeUI.setConfig({
  // 表格配置
  table: {
    border: true,
    stripe: true,
    round: true,
    showOverflow: 'title',
    showHeaderOverflow: 'title',
    size: 'medium',
    tooltipConfig: {
      enterable: true,
    },
    columnConfig: {
      resizable: true,
      useKey: true,
      isHover: true,
    },
    rowConfig: {
      isCurrent: true,
      isHover: true,
    },
  },
  // 工具条配置
  toolbar: {
    custom: true,
    buttons: [],
    tools: [],
    size: 'medium',
  },
  // 分页配置
  pager: {
    border: true,
    size: 'medium',
  },
});

/**
 * 空壳组件: 部分组件如果没注册, vxe-table 内部引用会报错;
 * 实际没用组件, 只是为了不报错, 同时可以减少打包体积(上游 vben 同款手法)
 */
function createVirtualComponent(name = '') {
  return defineComponent({
    name,
  });
}

/**
 * 按需注册 vxe 组件, 替代原两端 bootstrap 的 app.use(VxeUITable)/app.use(VxeUI) 整包注册。
 * 全部具名导入, 配合 vite-config 已启用的 vxeTableLazyImport 插件(vite-plugin-lazy-import)
 * 在构建期改写为按组件路径引入, vxe 全量(2.6MB JS)不再进入首屏 chunk:
 * - app.component: 两端模板直用的表格族标签(vxe-table/vxe-column/vxe-colgroup/vxe-toolbar/vxe-pager)
 * - VxeUI.component: vxe 内部渲染依赖的通用组件注册表(loading/tooltip/modal/select 等)
 */
export function registerVxeComponents(app: App): void {
  app.component('VxeTable', VxeTable);
  app.component('VxeColumn', VxeColumn);
  app.component('VxeColgroup', VxeColgroup);
  app.component('VxeToolbar', VxeToolbar);
  app.component('VxePager', VxePager);

  VxeUI.component(VxeTable);
  VxeUI.component(VxeColumn);
  VxeUI.component(VxeColgroup);
  VxeUI.component(VxeToolbar);
  VxeUI.component(VxePager);
  VxeUI.component(VxeButton);
  VxeUI.component(VxeCheckbox);
  VxeUI.component(VxeIcon);
  VxeUI.component(VxeInput);
  VxeUI.component(VxeLoading);
  VxeUI.component(VxeModal);
  VxeUI.component(VxeNumberInput);
  VxeUI.component(VxeRadioGroup);
  VxeUI.component(VxeSelect);
  VxeUI.component(VxeTooltip);
  VxeUI.component(VxeUpload);
  VxeUI.component(createVirtualComponent('VxeForm'));
}

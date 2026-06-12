import enUS from 'vxe-pc-ui/lib/language/en-US';
import zhCN from 'vxe-pc-ui/lib/language/zh-CN';
import VXETable from 'vxe-table';
import { VxeUI } from 'vxe-table';

// 国际化配置
// 不知道为什么, 必须添加default之后才能正常使用
VxeUI.setI18n('en-US', enUS.default);
VxeUI.setI18n('zh-CN', zhCN.default);

/**
 * 是否设置暗黑模式
 * @param dark
 */
export function setDark(dark: boolean) {
  if (dark) {
    VXETable.setTheme('dark');
  } else {
    VXETable.setTheme('light');
  }
}

/**
 * 配置
 */
VXETable.setConfig({
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

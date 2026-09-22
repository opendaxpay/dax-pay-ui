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
import VXETable from 'vxe-table';
import { VxeUI } from 'vxe-table';

/**
 * 注册 vxe 语言包与全局默认配置
 * 原为模块顶层副作用, 会把 vxe 静态拉进首屏; 现由 [ensureVxe] 在 vxe 动态加载后显式调用
 */
export function setupVxeConfig() {
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
}

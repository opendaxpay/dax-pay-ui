import type { SetupVxeTable } from './types';

import { defineComponent, watch } from 'vue';

import { usePreferences } from '@vben/preferences';

import { useVbenForm } from '@vben-core/form-ui';

import {
  VxeButton,
  VxeCheckbox,

  // VxeFormGather,
  // VxeForm,
  // VxeFormItem,
  VxeIcon,
  VxeInput,
  VxeLoading,
  VxeModal,
  VxeNumberInput,
  VxePager,
  // VxeList,
  // VxeModal,
  // VxeOptgroup,
  // VxeOption,
  // VxePulldown,
  // VxeRadio,
  // VxeRadioButton,
  VxeRadioGroup,
  VxeSelect,
  VxeTooltip,
  VxeUI,
  VxeUpload,
  // VxeSwitch,
  // VxeTextarea,
} from 'vxe-pc-ui';
import enUS from 'vxe-pc-ui/lib/language/en-US';
import idID from 'vxe-pc-ui/lib/language/id-ID';
import jaJP from 'vxe-pc-ui/lib/language/ja-JP';
import koKR from 'vxe-pc-ui/lib/language/ko-KR';
import msMY from 'vxe-pc-ui/lib/language/ms-MY';
import thTH from 'vxe-pc-ui/lib/language/th-TH';
import viVN from 'vxe-pc-ui/lib/language/vi-VN';
// 导入默认的语言
import zhCN from 'vxe-pc-ui/lib/language/zh-CN';
import zhHK from 'vxe-pc-ui/lib/language/zh-HK';
import zhTW from 'vxe-pc-ui/lib/language/zh-TW';
import {
  VxeColgroup,
  VxeColumn,
  VxeGrid,
  VxeTable,
  VxeToolbar,
} from 'vxe-table';

import { extendsDefaultFormatter } from './extends';

// 是否加载过
let isInit = false;

let tableFormFactory: typeof useVbenForm | undefined;

export const useTableForm: typeof useVbenForm = ((...args) => {
  if (!tableFormFactory) {
    throw new Error('useTableForm is not initialized');
  }

  return tableFormFactory(...args);
}) as typeof useVbenForm;

// 部分组件，如果没注册，vxe-table 会报错，这里实际没用组件，只是为了不报错，同时可以减少打包体积
const createVirtualComponent = (name = '') => {
  return defineComponent({
    name,
  });
};

export function initVxeTable() {
  if (isInit) {
    return;
  }

  VxeUI.component(VxeTable);
  VxeUI.component(VxeColumn);
  VxeUI.component(VxeColgroup);
  VxeUI.component(VxeGrid);
  VxeUI.component(VxeToolbar);

  VxeUI.component(VxeButton);
  // VxeUI.component(VxeButtonGroup);
  VxeUI.component(VxeCheckbox);
  // VxeUI.component(VxeCheckboxGroup);
  VxeUI.component(createVirtualComponent('VxeForm'));
  // VxeUI.component(VxeFormGather);
  // VxeUI.component(VxeFormItem);
  VxeUI.component(VxeIcon);
  VxeUI.component(VxeInput);
  // VxeUI.component(VxeList);
  VxeUI.component(VxeLoading);
  VxeUI.component(VxeModal);
  VxeUI.component(VxeNumberInput);
  // VxeUI.component(VxeOptgroup);
  // VxeUI.component(VxeOption);
  VxeUI.component(VxePager);
  // VxeUI.component(VxePulldown);
  // VxeUI.component(VxeRadio);
  // VxeUI.component(VxeRadioButton);
  VxeUI.component(VxeRadioGroup);
  VxeUI.component(VxeSelect);
  // VxeUI.component(VxeSwitch);
  // VxeUI.component(VxeTextarea);
  VxeUI.component(VxeTooltip);
  VxeUI.component(VxeUpload);

  isInit = true;
}

export function setupVbenVxeTable(setupOptions: SetupVxeTable) {
  const { configVxeTable, useVbenForm } = setupOptions;

  initVxeTable();
  tableFormFactory = useVbenForm;

  const { isDark, locale } = usePreferences();

  const localMap: Record<string, typeof zhCN> = {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh-TW': zhTW,
    'zh-HK': zhHK,
    'ja-JP': jaJP,
    'ko-KR': koKR,
    'id-ID': idID,
    'vi-VN': viVN,
    'th-TH': thTH,
    'ms-MY': msMY,
  };

  watch(
    [() => isDark.value, () => locale.value],
    ([isDarkValue, localeValue]) => {
      VxeUI.setTheme(isDarkValue ? 'dark' : 'light');
      // 未知 locale 回退 en-US 语言包，避免 setI18n(undefined)
      const pack = localMap[localeValue] ?? localMap['en-US'];
      const lang = localMap[localeValue] ? localeValue : 'en-US';
      VxeUI.setI18n(lang, pack);
      VxeUI.setLanguage(lang);
    },
    {
      immediate: true,
    },
  );

  extendsDefaultFormatter(VxeUI);

  configVxeTable(VxeUI);
}

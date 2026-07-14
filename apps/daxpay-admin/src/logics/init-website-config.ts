import type { WebsiteConfig } from '#/api/system/website-config.api';

import { ref } from 'vue';

import { updatePreferences } from '@vben/preferences';

import { WebsiteConfigApi } from '#/api/system/website-config.api';
import { useApiPrefix } from '#/hooks/useApiPrefix';

const STORAGE_KEY = 'daxpay-website-config';

/** 全局站点配置(响应式) */
export const websiteConfig = ref<WebsiteConfig>({});

/**
 * 初始化站点配置
 *
 * 先读 localStorage 缓存避免闪烁, 再请求后端覆盖.
 * 成功后同步 app 名称、Logo 与 favicon.
 */
export async function initWebsiteConfig() {
  // 缓存优先, 减少首屏品牌闪烁
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      websiteConfig.value = JSON.parse(cached) as WebsiteConfig;
      applyWebsiteBranding(websiteConfig.value);
    } catch {
      // 缓存损坏则忽略
    }
  }

  try {
    const { data } = await WebsiteConfigApi.get();
    if (data) {
      websiteConfig.value = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      applyWebsiteBranding(data);
    }
  } catch {
    // 免登接口失败时保留缓存/默认品牌, 不阻断启动
  }
}

/**
 * 将站点配置应用到 preferences 与 document
 */
export function applyWebsiteBranding(config: WebsiteConfig) {
  const apiPrefix = useApiPrefix();
  const logoUrl = config.wholeLogo
    ? `${apiPrefix}/file/platform/access/${config.wholeLogo}`
    : undefined;
  const simpleLogoUrl = config.simpleLogo
    ? `${apiPrefix}/file/platform/access/${config.simpleLogo}`
    : undefined;
  const brandLogo = logoUrl || simpleLogoUrl;

  const hasCopyrightContent = !!(
    config.copyright ||
    config.companyName ||
    config.icpInfo
  );

  updatePreferences({
    ...(config.systemName
      ? {
          app: {
            name: config.systemName,
          },
        }
      : {}),
    ...(brandLogo
      ? {
          logo: {
            source: brandLogo,
            sourceDark: brandLogo,
          },
        }
      : {}),
    copyright: {
      enable: hasCopyrightContent,
      companyName: config.copyright || config.companyName || '',
      companySiteLink: config.copyrightLink || '',
      icp: config.icpInfo || '',
      icpLink: config.icpLink || '',
    },
  });

  // favicon 使用完整 logo(若有)
  if (logoUrl) {
    const favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (favicon) {
      favicon.href = `${logoUrl}?t=${Date.now()}`;
    }
  }
}

/**
 * 获取系统名称(带缓存)
 */
export function getSystemName() {
  return websiteConfig.value.systemName || '';
}

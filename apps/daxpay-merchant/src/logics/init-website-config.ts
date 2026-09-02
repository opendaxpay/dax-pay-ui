import type { WebsiteConfig } from '#/api/system/website-config.api';

import { ref, watch } from 'vue';

import { updatePreferences } from '@vben/preferences';

import { WebsiteConfigApi } from '#/api/system/website-config.api';
import { useApiPrefix } from '#/hooks/useApiPrefix';
// 国际化: i18n 实例与 $t 用于拼接商户端后缀('商户端'/'Merchant'...)
import { $t, i18n } from '#/locales';

/** localStorage 键: 站点配置缓存 envelope（按端隔离，避免与运营端串缓存） */
const STORAGE_KEY = 'daxpay-website-config-merchant';

/** 商户端静态默认品牌(配置为空时回落)
 *  注意: 此处仅保留纯品牌名, 不含任何端后缀;
 *  后缀('商户端'/'Merchant')由 applyWebsiteBranding 用 i18n 动态拼接,
 *  避免与语言相关的后缀在此硬编码导致双重后缀或语言错配.
 */
const DEFAULT_BRAND = {
  systemName: 'DaxPay',
  logo: '/logo.png',
  logoDark: '/logo-dark.png',
  favicon: '/favicon.ico',
} as const;

/** 本地缓存信封 */
interface WebsiteConfigCacheEnvelope {
  hash: string;
  data: WebsiteConfig;
}

/** 全局站点配置(响应式) */
export const websiteConfig = ref<WebsiteConfig>({});

/** 当前已应用到 favicon 的 logo 文件 id(空串表示默认 favicon) */
let appliedLogoId: string | undefined;

/** 当前本地缓存 hash(用于远程比对) */
let localHash: string | undefined;

/**
 * 初始化站点配置
 *
 * 1. 同步读 localStorage → apply(防闪)
 * 2. 异步拉远程 → hash 一致则跳过; 否则写盘 + re-apply(允许闪)
 */
export async function initWebsiteConfig() {
  const cached = readCache();
  if (cached) {
    websiteConfig.value = cached.data;
    localHash = cached.hash;
    applyWebsiteBranding(cached.data);
  }

  try {
    const { data } = await WebsiteConfigApi.get();
    if (!data) {
      return;
    }
    const remoteHash = resolveRemoteHash(data);
    // 有本地缓存且 hash 一致: 不写盘、不 re-apply
    if (localHash && remoteHash && remoteHash === localHash) {
      return;
    }
    persistWebsiteConfig(data, remoteHash);
  } catch {
    // 免登接口失败时保留缓存/默认品牌, 不阻断启动
  }
}

/**
 * 站点配置落盘后强制 apply(不依赖远程往返)
 */
export function persistWebsiteConfig(raw: WebsiteConfig, hash?: string) {
  const data = stripContentHash(raw);
  const nextHash = hash || raw.contentHash || clientHash(data);
  websiteConfig.value = data;
  localHash = nextHash;
  writeCache({ hash: nextHash, data });
  applyWebsiteBranding(data);
}

/**
 * 将站点配置应用到 preferences / document / favicon
 *
 * 空字段显式回落 DEFAULT_BRAND, 避免残留上次配置.
 */
export function applyWebsiteBranding(config: WebsiteConfig) {
  const apiPrefix = useApiPrefix();
  const logoId = config.logo?.trim() || '';
  const logoDarkId = config.logoDark?.trim() || '';

  const logoUrl = logoId
    ? `${apiPrefix}/file/platform/access/${logoId}`
    : DEFAULT_BRAND.logo;
  const logoDarkUrl = logoDarkId
    ? `${apiPrefix}/file/platform/access/${logoDarkId}`
    : logoId
      ? logoUrl
      : DEFAULT_BRAND.logoDark;

  // 商户端原始品牌名(后端配置或默认)
  const rawName = config.systemName?.trim() || DEFAULT_BRAND.systemName;
  // 商户端统一追加 i18n 后缀('商户端'/'Merchant'...), 区分 H5/小程序等其他端, 避免各端名称完全相同
  const systemName = `${rawName} ${$t('common.merchantSuffix')}`;

  const copyrightText = config.copyright?.trim() || config.companyName?.trim() || '';
  const hasCopyrightContent = !!(
    copyrightText ||
    config.icpInfo ||
    config.mpsInfo ||
    config.pcacInfo ||
    config.icpPlusInfo ||
    config.companyPhone ||
    config.companyEmail ||
    config.companyWechat
  );

  updatePreferences({
    app: {
      name: systemName,
    },
    logo: {
      source: logoUrl,
      sourceDark: logoDarkUrl,
    },
    copyright: {
      // 简易版权仍供主布局 preferences 兼容; 登录页用 WebsiteFooter 读 websiteConfig
      enable: hasCopyrightContent,
      companyName: copyrightText,
      icp: config.icpInfo || '',
      icpLink: config.icpLink || '',
    },
  });

  applyFavicon(logoId, apiPrefix);
}

/**
 * 受控 favicon: 仅 logo id 变化时改 href, 禁止 Date.now()
 */
function applyFavicon(logoId: string, apiPrefix: string) {
  const link = document.getElementById('favicon') as HTMLLinkElement | null;
  if (!link) {
    return;
  }
  const nextId = logoId || '';
  if (nextId === (appliedLogoId ?? '')) {
    return;
  }
  appliedLogoId = nextId;
  link.href = nextId
    ? `${apiPrefix}/file/platform/access/${nextId}`
    : DEFAULT_BRAND.favicon;
}

// ---------- getters(商业版风格, 页面只读 getter) ----------

/** 裸品牌名(不带端后缀), 供 i18n 插值场景使用(如登录页大标题 {name} 商户服务平台) */
export function getRawSystemName() {
  return websiteConfig.value.systemName?.trim() || DEFAULT_BRAND.systemName;
}

export function getSystemName() {
  // 商户端统一拼接后缀, 与 applyWebsiteBranding 写入 preferences.app.name 保持一致
  const rawName = getRawSystemName();
  return `${rawName} ${$t('common.merchantSuffix')}`;
}

export function getLogoUrl() {
  const id = websiteConfig.value.logo?.trim();
  if (!id) {
    return DEFAULT_BRAND.logo;
  }
  return `${useApiPrefix()}/file/platform/access/${id}`;
}

export function getLogoDarkUrl() {
  const darkId = websiteConfig.value.logoDark?.trim();
  if (darkId) {
    return `${useApiPrefix()}/file/platform/access/${darkId}`;
  }
  return getLogoUrl() === DEFAULT_BRAND.logo ? DEFAULT_BRAND.logoDark : getLogoUrl();
}

export function getCompanyName() {
  return websiteConfig.value.companyName?.trim() || '';
}

export function getCompanyPhone() {
  return websiteConfig.value.companyPhone?.trim() || '';
}

export function getCompanyEmail() {
  return websiteConfig.value.companyEmail?.trim() || '';
}

export function getCompanyWechat() {
  return websiteConfig.value.companyWechat?.trim() || '';
}

export function getCopyright() {
  return websiteConfig.value.copyright?.trim() || getCompanyName();
}

export function getIcpInfo() {
  return websiteConfig.value.icpInfo?.trim() || '';
}

export function getIcpLink() {
  return websiteConfig.value.icpLink?.trim() || '';
}

export function getMpsInfo() {
  return websiteConfig.value.mpsInfo?.trim() || '';
}

export function getMpsLink() {
  return websiteConfig.value.mpsLink?.trim() || '';
}

export function getPcacInfo() {
  return websiteConfig.value.pcacInfo?.trim() || '';
}

export function getPcacLink() {
  return websiteConfig.value.pcacLink?.trim() || '';
}

export function getIcpPlusInfo() {
  return websiteConfig.value.icpPlusInfo?.trim() || '';
}

export function getIcpPlusLink() {
  return websiteConfig.value.icpPlusLink?.trim() || '';
}

/** 是否有页脚可展示内容 */
export function hasWebsiteFooterContent() {
  return !!(
    getCopyright() ||
    getIcpInfo() ||
    getMpsInfo() ||
    getPcacInfo() ||
    getIcpPlusInfo() ||
    getCompanyPhone() ||
    getCompanyEmail() ||
    getCompanyWechat()
  );
}

// ---------- 缓存 / hash 工具 ----------

function readCache(): WebsiteConfigCacheEnvelope | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as WebsiteConfigCacheEnvelope | WebsiteConfig;
    // 新 envelope
    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      'hash' in parsed &&
      parsed.data &&
      typeof (parsed as WebsiteConfigCacheEnvelope).hash === 'string'
    ) {
      return parsed as WebsiteConfigCacheEnvelope;
    }
    // 旧扁平缓存: 无 hash, 强制后续用远程覆盖
    const flat = parsed as WebsiteConfig;
    return {
      hash: '',
      data: stripContentHash(flat),
    };
  } catch {
    return null;
  }
}

function writeCache(envelope: WebsiteConfigCacheEnvelope) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

function stripContentHash(config: WebsiteConfig): WebsiteConfig {
  const { contentHash: _h, ...rest } = config;
  return rest;
}

function resolveRemoteHash(data: WebsiteConfig): string {
  if (data.contentHash) {
    return data.contentHash;
  }
  return clientHash(stripContentHash(data));
}

/**
 * 前端兜底 hash: key 排序后 djb2, 仅当服务端无 contentHash 时使用
 */
function clientHash(data: WebsiteConfig): string {
  const keys = Object.keys(data).sort() as (keyof WebsiteConfig)[];
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    if (key === 'contentHash') {
      continue;
    }
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value;
    }
  }
  const str = JSON.stringify(normalized);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// 监听语言切换, 重新 apply branding 让后缀('商户端'/'Merchant'...)跟随语言重算.
// 时序安全: 本模块在 bootstrap.ts 中通过 await import() 动态加载,
// 调用时机晚于 setupI18n, 故 i18n.global.locale 在此处已可用.
watch(
  () => i18n.global.locale.value,
  () => {
    // 仅当已加载站点配置时才重 apply, 避免初始化前用空对象覆盖默认品牌
    if (Object.keys(websiteConfig.value).length > 0) {
      applyWebsiteBranding(websiteConfig.value);
    }
  },
);

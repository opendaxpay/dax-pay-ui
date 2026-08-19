import SecureLS from 'secure-ls';

type SecureLSStorage = {
  get(key: string): any;
  set(key: string, value: unknown): void;
};

type SecureLSCtor = new (config?: {
  encodingType?: string;
  encryptionSecret?: string;
  isCompression?: boolean;
  metaKey?: string;
}) => SecureLSStorage;

// ESM/CJS 双格式兼容处理(与 setup.ts 一致)
const secureLSModule = SecureLS as unknown as {
  default?: SecureLSCtor;
  SecureLS?: SecureLSCtor;
};

const SecureLSConstructor =
  secureLSModule.default ??
  secureLSModule.SecureLS ??
  (SecureLS as unknown as SecureLSCtor);

// SecureLS 元信息 key(记录每个条目的加密/压缩处理标记)
const META_KEY = 'daxpay-secure-storage-meta';

// 独立于 pinia 持久化的 SecureLS 实例, meta 各自隔离互不影响;
// 不区分 dev/prod, 敏感数据(如支付调试页的商户私钥)在任何构建模式下都加密
const ls = new SecureLSConstructor({
  encodingType: 'aes',
  encryptionSecret: import.meta.env.VITE_APP_STORE_SECURE_KEY,
  isCompression: true,
  metaKey: META_KEY,
});

/**
 * 加密存储工具
 *
 * 供非 pinia 场景的敏感数据持久化使用(如支付调试页面保存的商户应用私钥),
 * 写入 localStorage 前经 AES 加密 + 压缩, 读取时自动解密, 避免私钥明文落盘被直接查看
 */
export const secureStorage = {
  getItem(key: string): null | string {
    try {
      const value = ls.get(key);
      return value == null ? null : String(value);
    } catch {
      // 解密失败(密钥变更/数据损坏)视为未存储
      return null;
    }
  },
  setItem(key: string, value: string): void {
    ls.set(key, String(value));
  },
  /**
   * 移除条目(密文与 meta 残留记录均清理)
   * SecureLS 未提供单 key 移除 API, 需手动同时清理密文与 meta 中的处理标记
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    try {
      const meta = JSON.parse(localStorage.getItem(META_KEY) || '{}');
      if (key in meta) {
        // eslint 禁止动态 delete, 用解构剔除该条目后重写
        const { [key]: _removed, ...rest } = meta;
        localStorage.setItem(META_KEY, JSON.stringify(rest));
      }
    } catch {
      // meta 解析失败不影响移除主数据
    }
  },
};

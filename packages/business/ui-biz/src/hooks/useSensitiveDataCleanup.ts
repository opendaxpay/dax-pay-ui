/**
 * 会话结束需清理的敏感 localStorage key
 *
 * 后续新增清理项时, 在此数组追加即可 —— 这是"会话结束清理"的单一事实源。
 * 当前包含: 支付调试功能保存的商户私钥(DevelopTrade / DevelopGateway 页面)
 */
const SENSITIVE_STORAGE_KEYS = [
  'daxpay_dev_private_key',
  'daxpay_dev_gateway_private_key',
] as const;

/**
 * 敏感数据清理 hook
 *
 * 统一管理登录过期 / 主动登出时需要清除的敏感凭证。
 * 后续所有"会话结束即失效"的清理逻辑都集中到此处, 调用方无需关心细节。
 *
 * 行为:
 * - PROD 模式: 清除 [SENSITIVE_STORAGE_KEYS] 中所有 key
 * - DEV 模式: 保留(方便反复调试, 避免每次重新输入私钥)
 */
export function useSensitiveDataCleanup() {
  /**
   * 会话结束(登录过期 / 登出)时调用, 清除敏感数据
   *
   * 幂等: 对不存在的 key 调 removeItem 无副作用, 重复调用安全
   */
  function clearOnSessionEnd() {
    // 开发模式保留, 方便反复调试
    if (!import.meta.env.PROD) return;
    for (const key of SENSITIVE_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }

  return { clearOnSessionEnd };
}

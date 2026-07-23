import { useAccess } from '@vben/access';

/**
 * 权限判断 Hook
 * 封装 useAccess 的 hasAccessByCodes 方法，提供更简洁的 API
 */
export function usePermission() {
  const { hasAccessByCodes } = useAccess();

  /**
   * 判断是否有指定权限码
   * @param code 权限码
   * @returns 是否有权限
   */
  function hasPermission(code: string): boolean {
    return hasAccessByCodes([code]);
  }

  /**
   * 判断是否有任一权限码
   * @param codes 权限码数组
   * @returns 是否有任一权限
   */
  function hasAnyPermission(codes: string[]): boolean {
    return hasAccessByCodes(codes);
  }

  return {
    hasPermission,
    hasAnyPermission,
  };
}

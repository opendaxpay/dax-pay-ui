import type { QuickEntryMeta } from './types';

/**
 * 默认序列：defaultVisible=true 的按 defaultOrder 升序
 *
 * @param catalog 入口目录（各端自行声明的单一事实源）
 */
export function getDefaultEntries(catalog: QuickEntryMeta[]): string[] {
  return catalog
    .filter((e) => e.defaultVisible)
    .toSorted((a, b) => a.defaultOrder - b.defaultOrder)
    .map((e) => e.key);
}

/**
 * 按权限过滤可选入口池
 *
 * 仅返回当前用户有权限访问的入口（按 defaultOrder 升序）
 * 用于编辑抽屉的"可选池"
 *
 * @param catalog 入口目录（各端自行声明的单一事实源）
 * @param hasPermission 权限判断函数（来自 usePermission）
 */
export function getAvailableCatalogEntries(
  catalog: QuickEntryMeta[],
  hasPermission: (code: string) => boolean,
): QuickEntryMeta[] {
  return catalog
    .filter((e) => e.perms.length === 0 || e.perms.some((p) => hasPermission(p)))
    .toSorted((a, b) => a.defaultOrder - b.defaultOrder);
}

/**
 * 按 key 批量还原入口元信息
 *
 * 过滤掉 catalog 中已不存在的脏数据（如旧配置残留的失效 key）
 *
 * @param catalog 入口目录（各端自行声明的单一事实源）
 * @param keys 用户已选入口 key 序列
 */
export function resolveCatalogEntries(
  catalog: QuickEntryMeta[],
  keys: string[],
): QuickEntryMeta[] {
  return keys
    .map((k) => catalog.find((e) => e.key === k))
    .filter((v): v is QuickEntryMeta => !!v);
}

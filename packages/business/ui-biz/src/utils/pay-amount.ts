/**
 * 支付金额工具（分 ↔ 元）
 *
 * 后端 Long 经 JavaLongTypeModule 序列化为 JSON 字符串，算术前须 Number() 归一。
 * 金额单位：后端最小货币单位(分)，前端展示为元，保留 2 位小数。
 */

/** 将后端 Long/number/string 安全转为有限数字；无效时返回 undefined */
export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 金额分 → 元（保留 2 位小数）
 *
 * 使用 Math.round(fen) / 100，避免 Math.round(fen/100) 把不足 0.5 元抹成 0。
 * 无效或 ≤0 返回 0。
 */
export function fenToYuan(fen?: unknown): number {
  const n = toNumber(fen);
  if (n === undefined || n <= 0) return 0;
  return Math.round(n) / 100;
}

/**
 * 金额分 → 元；分字段缺失时返回 undefined（用于「—」占位，与真·0 区分）
 */
export function fenToYuanOrUndefined(fen?: unknown): number | undefined {
  if (fen === null || fen === undefined || fen === '') return undefined;
  return fenToYuan(fen);
}

/** 元金额千分位格式化（固定 2 位小数） */
export function formatYuan(yuan: number): string {
  return yuan.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

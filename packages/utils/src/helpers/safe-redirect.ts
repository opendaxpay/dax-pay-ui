/**
 * 解码并校验站内跳转地址，避免非法编码和外部地址进入路由跳转。
 */
export function decodeSafeRedirect(value: unknown, fallback = ''): string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    return fallback;
  }

  let path = rawValue;
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) {
        break;
      }
      path = decoded;
    } catch {
      return fallback;
    }
  }

  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    /^[a-z][a-z\d+.-]*:/i.test(path)
  ) {
    return fallback;
  }

  return path;
}

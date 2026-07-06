/**
 * 读取二进制文件内容为 Base64 字符串
 *
 * 注意: PEM/CRT 等文本格式的证书请使用 readFileAsText, 无需额外 Base64 编码
 */
export async function readFileAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

/**
 * 读取文件内容为纯文本（用于 .crt 等文本格式的证书）
 */
export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

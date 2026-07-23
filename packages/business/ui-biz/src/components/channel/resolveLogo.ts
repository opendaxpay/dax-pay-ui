/** 通道 / 产品 Logo SVG 包内解析（单一事实源：src/assets/channel） */

const logoModules = import.meta.glob('../../assets/channel/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/**
 * 按文件名（不含扩展名）解析通道 Logo URL；文件不存在返回 undefined
 */
export function resolveChannelLogoUrl(fileName: string): string | undefined {
  return logoModules[`../../assets/channel/${fileName}.svg`];
}

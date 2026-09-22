/**
 * 语言包 barrel 生成器：把每个 locale 目录下的全部词条 json 聚合为 index.ts barrel
 *
 * 背景：import.meta.glob 按每个词条 json 生成一个独立的动态 chunk
 * （运营端 1300+ 碎片文件、首屏当前语言要发 30+ 个小请求收齐词条）。
 * barrel 化后 glob 改扫 langs 下每 locale 的 index.ts，每 locale 收敛为一个 chunk。
 *
 * barrel 形态：default 导出 [keyPath, messages] 记录数组，加载方
 * （packages/locales 的 loadLocalesMapFromBarrel）按 keyPath 逐条组装嵌套消息对象，
 * key 结构与旧的「按文件路径切段」完全等价。
 *
 * 用法：
 *   node scripts/gen-locale-barrels.mjs
 *
 * 何时需要重跑：新增/删除/移动 langs/<locale>/ 下的词条 json 后必须重跑，
 * 否则变更不会进入语言包加载链路（glob 只扫 index.ts）。
 * 幂等：重复执行生成相同内容。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

// 三处 langs 根：框架层 + 两端应用层
const LANG_ROOTS = [
  'packages/locales/src/langs',
  'apps/daxpay-admin/src/locales/langs',
  'apps/daxpay-merchant/src/locales/langs',
]

/** 递归枚举目录下全部 .json 的相对路径（统一 / 分隔，字典序） */
function listJsonFiles(dir, prefix = '') {
  const out = []
  for (const name of fs.readdirSync(dir)) {
    if (name === 'index.ts') {
      continue
    }
    const rel = prefix ? `${prefix}/${name}` : name
    const abs = path.join(dir, name)
    if (fs.statSync(abs).isDirectory()) {
      out.push(...listJsonFiles(abs, rel))
    } else if (name.endsWith('.json')) {
      out.push(rel)
    }
  }
  return out.toSorted()
}

/** ['iam','pay-config','role'] -> mIamPayConfigRole（m 前缀规避保留字与数字开头） */
function toVarName(keyPath) {
  const pascal = keyPath
    .flatMap((seg) => seg.split(/[-_.]/))
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join('')
  return `m${pascal}`
}

function renderBarrel(locale, files) {
  const imports = files
    .map((rel) => `import ${toVarName(rel.slice(0, -5).split('/'))} from './${rel}';`)
    .join('\n')
  const entries = files
    .map((rel) => {
      const keyPath = rel.slice(0, -5).split('/')
      const segs = keyPath.map((s) => `'${s}'`).join(', ')
      return `  [[${segs}], ${toVarName(keyPath)}],`
    })
    .join('\n')
  return `/**
 * ${locale} 语言包 barrel（由 scripts/gen-locale-barrels.mjs 生成，勿手改）
 *
 * 每个词条 json 对应一条 [keyPath, messages] 记录，加载方按 keyPath 组装嵌套
 * 消息对象，key 结构与旧的按文件路径 glob 完全等价。
 * 新增/删除词条文件后须重跑生成脚本，否则变更不生效。
 */
${imports}

type LocaleEntry = [keyPath: string[], messages: Record<string, unknown>];

const entries: LocaleEntry[] = [
${entries}
];

export default entries;
`
}

function main() {
  let total = 0
  for (const root of LANG_ROOTS) {
    const absRoot = path.join(repoRoot, root)
    const locales = fs
      .readdirSync(absRoot)
      .filter((name) => fs.statSync(path.join(absRoot, name)).isDirectory())
      .toSorted()
    for (const locale of locales) {
      const dir = path.join(absRoot, locale)
      const files = listJsonFiles(dir)
      if (files.length === 0) {
        continue
      }
      // 顶层必须是普通对象（词条文件），数组/标量在加载链路无法按 keyPath 合并
      for (const rel of files) {
        const data = JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'))
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          console.error(`[gen-locale-barrels] ${root}/${locale}/${rel} 顶层不是对象，跳过生成并报错`)
          process.exit(1)
        }
      }
      const target = path.join(dir, 'index.ts')
      fs.writeFileSync(target, renderBarrel(locale, files), 'utf8')
      total += 1
      console.log(`[gen-locale-barrels] ${root}/${locale}/index.ts <- ${files.length} json`)
    }
  }
  console.log(`[gen-locale-barrels] done, ${total} barrels`)
}

main()

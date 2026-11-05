/**
 * Web 端 i18n key 引用校验：扫描两端应用源码里用到的 key，比对语言包注册的 key
 *
 * 背景：词条 key 是字符串字面量，拼错/层级错位/新增页面漏建词条时编译与类型检查都发现不了，
 * 只会在运行时回退成 key 本身（导航标题空白/页面出现英文点分串）。本脚本把「源码引用」
 * 与「语言包定义」做静态比对，供手动执行或挂 precommit 使用（退出码非 0 表示有缺失）。
 *
 * 输入（不猜路径，全部按真实加载链路读取）：
 * - apps/daxpay-admin|daxpay-merchant 的 src/locales/langs/{locale}/index.ts barrel
 *   解析其中 `[[keyPath], messages]` 注册，keyPath 拼上 JSON 内部嵌套路径得到完整 key
 * - 两端 src/locales/menu-titles/{locale}.json（flat key，菜单标题真相源）
 * - 两端 src/locales/flat/{locale}.json（顶层 fallback 文案，运行时并入）
 * - packages/locales/src/langs/{locale}/**\/*.json（框架层，keyPath = 文件路径切段）
 *
 * 提取来源：
 * - 两端 src/**\/*.{vue,ts}（排除 locales 目录）中的 $t('...') / t('...') / i18n.global.t('...')
 * - router 下 .ts 的 meta.title 里 key 形态字符串（含点的标识符串）
 * - 含 `${` 的模板字符串、变量实参等动态调用跳过并单独计数（不判失败）
 *
 * 说明：本地 wrapper（如 `function t(key) { return $t(prefix + key) }`）的实参不是完整 key，
 * 属已知误报来源；脚本对「文件内自行声明了 t」的情况跳过其裸 t(...) 调用，$t(...) 仍照常校验。
 *
 * 用法：
 *   node scripts/check-locale-refs.mjs
 *   node scripts/check-locale-refs.mjs --locale zh-CN --verbose
 *   node scripts/check-locale-refs.mjs --json
 *
 * 退出码：存在 used-but-undefined 时为 1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const APPS = ['apps/daxpay-admin', 'apps/daxpay-merchant']
const FRAMEWORK_LANGS = 'packages/locales/src/langs'

const KEY_SHAPE = /^[A-Za-z_$][\w$-]*(\.[\w$-]+)+$/

/** 递归枚举目录（跳过 node_modules / dist / locales 由调用方过滤） */
function walkFiles(dir, filter, out = []) {
  if (!fs.existsSync(dir)) {
    return out
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') {
        continue
      }
      walkFiles(fp, filter, out)
    } else if (filter(fp)) {
      out.push(fp)
    }
  }
  return out
}

/** JSON 叶子 key 展开（数组按叶子处理，与运行时一致） */
function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out)
    } else {
      out.add(key)
    }
  }
  return out
}

function collectJsonKeys(file, prefix, out) {
  if (!fs.existsSync(file)) {
    console.error(`[check-locale-refs] 词条文件不存在: ${file}`)
    process.exitCode = 2
    return
  }
  let data
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    console.error(`[check-locale-refs] 词条 JSON 解析失败: ${file} (${error.message})`)
    process.exitCode = 2
    return
  }
  flatten(data, prefix, out)
}

/** 递归列出词条 json 的相对路径（去掉 .json，统一 / 分隔） */
function listJsonRelPaths(dir, prefix = '') {
  const out = []
  if (!fs.existsSync(dir)) {
    return out
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'index.ts') {
      continue
    }
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name
    const abs = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...listJsonRelPaths(abs, rel))
    } else if (ent.name.endsWith('.json')) {
      out.push(rel.slice(0, -'.json'.length))
    }
  }
  return out.sort()
}

/**
 * barrel 与磁盘词条文件不一致时提示。
 * dev 走 glob 词条 json、生产走 barrel，漏重跑 gen-locale-barrels.mjs 只会在生产表现为缺 key。
 */
function warnBarrelDrift(label, registered, files) {
  const fileSet = new Set(files)
  const missingInBarrel = files.filter((f) => !registered.has(f))
  const staleInBarrel = [...registered].filter((f) => !fileSet.has(f))
  if (missingInBarrel.length === 0 && staleInBarrel.length === 0) {
    return
  }
  console.warn(`[check-locale-refs] WARN ${label} barrel 与词条文件不一致（请重跑 scripts/gen-locale-barrels.mjs）`)
  if (missingInBarrel.length > 0) {
    console.warn(`  未注册进 barrel: ${missingInBarrel.join(', ')}`)
  }
  if (staleInBarrel.length > 0) {
    console.warn(`  barrel 中的旧文件: ${staleInBarrel.join(', ')}`)
  }
}

/**
 * 读取应用层 barrel，解析 [[keyPath], messages] 注册。
 * keyPath 来自 barrel 的显式注册（生产加载链路），不按目录 glob 猜。
 */
function loadAppKeys(appDir, locale, out) {
  const langsDir = path.join(repoRoot, appDir, 'src/locales/langs', locale)
  const barrel = path.join(langsDir, 'index.ts')
  if (!fs.existsSync(barrel)) {
    console.error(`[check-locale-refs] barrel 不存在: ${barrel}`)
    process.exitCode = 2
    return
  }
  const src = fs.readFileSync(barrel, 'utf8')
  const imports = new Map()
  for (const m of src.matchAll(/import\s+([\w$]+)\s+from\s+'(\.\/[^']+)'/g)) {
    imports.set(m[1], m[2])
  }
  const registered = new Set()
  let entries = 0
  for (const m of src.matchAll(/^\s*\[\[(.*?)\],\s*([\w$]+)\],?\s*$/gm)) {
    const keyPath = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1])
    const rel = imports.get(m[2])
    if (!rel) {
      console.error(`[check-locale-refs] barrel 注册找不到对应 import: ${barrel} -> ${m[2]}`)
      process.exitCode = 2
      continue
    }
    registered.add(rel.replace(/^\.\//, '').replace(/\.json$/, ''))
    collectJsonKeys(path.resolve(langsDir, rel), keyPath.join('.'), out)
    entries += 1
  }
  warnBarrelDrift(barrel.replace(/\\/g, '/'), registered, listJsonRelPaths(langsDir))
  if (entries === 0) {
    console.error(`[check-locale-refs] barrel 未解析到任何注册: ${barrel}`)
    process.exitCode = 2
  }
}

/** 框架层：keyPath = 相对 langs/{locale} 的文件路径切段 */
function loadFrameworkKeys(locale, out) {
  const dir = path.join(repoRoot, FRAMEWORK_LANGS, locale)
  if (!fs.existsSync(dir)) {
    console.error(`[check-locale-refs] 框架层语言包目录不存在: ${dir}`)
    process.exitCode = 2
    return
  }
  const files = walkFiles(dir, (fp) => fp.endsWith('.json'))
  for (const fp of files) {
    const rel = path.relative(dir, fp).replace(/\\/g, '/').replace(/\.json$/, '')
    collectJsonKeys(fp, rel.split('/').join('.'), out)
  }
  // 框架层同样有 barrel（gen-locale-barrels 统一生成），生产走 barrel，需检查是否漏重生成
  const barrel = path.join(dir, 'index.ts')
  if (fs.existsSync(barrel)) {
    const src = fs.readFileSync(barrel, 'utf8')
    const registered = new Set()
    for (const m of src.matchAll(/^\s*\[\[(.*?)\],\s*[\w$]+\],?\s*$/gm)) {
      const keyPath = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1])
      registered.add(keyPath.join('/'))
    }
    warnBarrelDrift(barrel.replace(/\\/g, '/'), registered, listJsonRelPaths(dir))
  }
}

/** 读 flat key 文件（menu-titles / flat 均为扁平 key） */
function loadFlatKeys(file, out) {
  if (!fs.existsSync(file)) {
    return
  }
  let data
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    console.error(`[check-locale-refs] flat 词条 JSON 解析失败: ${file} (${error.message})`)
    process.exitCode = 2
    return
  }
  for (const key of Object.keys(data ?? {})) {
    out.add(key)
  }
}

/**
 * 注释遮蔽：把注释内容替换为空格、字符串内部替换为空格（保留引号与换行），长度不变。
 * 这样后续正则只在代码区匹配，且偏移量可直接回原文取字符串内容。
 */
function maskSource(src, vue = false) {
  const out = [...src]
  const n = src.length

  const blank = (from, to) => {
    for (let p = from; p < to && p < n; p += 1) {
      if (src[p] !== '\n') {
        out[p] = ' '
      }
    }
  }

  // 遮蔽一个字符串字面量；模板字符串里的 ${...} 表达式按代码递归扫描（其中可能有 $t(...) 调用）
  const maskString = (start) => {
    const quote = src[start]
    out[start] = quote
    let i = start + 1
    while (i < n) {
      const ch = src[i]
      if (ch === '\\') {
        out[i] = ' '
        if (i + 1 < n && src[i + 1] !== '\n') {
          out[i + 1] = ' '
        }
        i += 2
        continue
      }
      if (ch === quote) {
        out[i] = quote
        return i + 1
      }
      if (quote === '`' && ch === '$' && src[i + 1] === '{') {
        i = maskCode(i + 2, true)
        continue
      }
      if (ch !== '\n') {
        out[i] = ' '
      }
      i += 1
    }
    return i
  }

  // 扫描代码区；stopAtTemplateExprEnd 时在匹配的 } 处返回（保留 } 供外层模板串继续）
  const maskCode = (start, stopAtTemplateExprEnd) => {
    let i = start
    let depth = 0
    while (i < n) {
      const c = src[i]
      const next = src[i + 1]
      if (c === '/' && next === '/') {
        let j = i
        while (j < n && src[j] !== '\n') {
          j += 1
        }
        blank(i, j)
        i = j
        continue
      }
      if (c === '/' && next === '*') {
        let j = i + 2
        while (j < n && !(src[j] === '*' && src[j + 1] === '/')) {
          j += 1
        }
        const end = Math.min(n, j + 2)
        blank(i, end)
        i = end
        continue
      }
      if (vue && c === '<' && src.startsWith('<!--', i)) {
        let j = i
        while (j < n && !src.startsWith('-->', j)) {
          j += 1
        }
        const end = Math.min(n, j + 3)
        blank(i, end)
        i = end
        continue
      }
      if (stopAtTemplateExprEnd && c === '{') {
        depth += 1
        i += 1
        continue
      }
      if (stopAtTemplateExprEnd && c === '}') {
        if (depth === 0) {
          return i + 1
        }
        depth -= 1
        i += 1
        continue
      }
      if (c === '\'' || c === '"' || c === '`') {
        i = maskString(i)
        continue
      }
      i += 1
    }
    return i
  }

  maskCode(0, false)
  return out.join('')
}

function buildLineIndex(src) {
  const starts = [0]
  for (let i = 0; i < src.length; i += 1) {
    if (src[i] === '\n') {
      starts.push(i + 1)
    }
  }
  return (offset) => {
    let lo = 0
    let hi = starts.length - 1
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      if (starts[mid] <= offset) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    return lo + 1
  }
}

/**
 * 从 openParen 之后的字符串字面量里取 key；返回动态标记表示无法静态判定。
 * 注意：偏移量来自 maskSource（保留长度与引号位置），内容必须回原文读。
 */
function readLiteralArg(src, openParen, allowBraceClose = false) {
  let i = openParen + 1
  while (i < src.length && /\s/.test(src[i])) {
    i += 1
  }
  const quote = src[i]
  if (quote !== '\'' && quote !== '"' && quote !== '`') {
    return { dynamic: true }
  }
  const start = i + 1
  i += 1
  while (i < src.length) {
    const ch = src[i]
    if (ch === '\\') {
      i += 2
      continue
    }
    if (ch === quote) {
      break
    }
    i += 1
  }
  if (i >= src.length) {
    return { dynamic: true }
  }
  const value = src.slice(start, i)
  let j = i + 1
  while (j < src.length && /\s/.test(src[j])) {
    j += 1
  }
  // 只取「唯一字符串实参」的调用；拼接（'a.' + b）、多段实参等一律视为动态
  if (src[j] !== ',' && src[j] !== ')' && !(allowBraceClose && src[j] === '}')) {
    return { dynamic: true }
  }
  if (quote === '`' && value.includes('${')) {
    return { dynamic: true }
  }
  return { key: value }
}

const CALL_RE = /(?<![\w$.])i18n\.global\.t\s*\(|(?<![\w$])\$t\s*\(|(?<![\w$.])t\s*\(/g

/** 扫描单个文件里的 i18n 引用 */
function scanFile(file, refs, counters) {
  const src = fs.readFileSync(file, 'utf8')
  const isVue = file.endsWith('.vue')
  const masked = maskSource(src, isVue)
  const lineOf = buildLineIndex(src)
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/')

  const localT = /(?:function\s+t\s*[(<]|(?:const|let|var)\s+t\s*=)/.test(masked)

  for (const m of masked.matchAll(CALL_RE)) {
    const call = m[0]
    const openParen = m.index + call.length - 1
    // 裸 t(...) 且本文件自行声明了 t：本地 wrapper，实参不是完整 key，跳过并计数
    if (!call.startsWith('$t') && !call.startsWith('i18n') && localT) {
      counters.localWrapperSkipped += 1
      continue
    }
    const arg = readLiteralArg(src, openParen)
    if (arg.dynamic) {
      counters.dynamicSkipped += 1
      continue
    }
    if (!arg.key || !KEY_SHAPE.test(arg.key)) {
      // 非点分 key（如本地 scope 的单段 key、纯文本）不参与全局语言包比对
      counters.nonDottedSkipped += 1
      continue
    }
    refs.push({ key: arg.key, file: rel, line: lineOf(m.index), source: 'call' })
  }

  if (rel.includes('/router/')) {
    for (const m of masked.matchAll(/\btitle\s*:\s*(['"])/g)) {
      const quoteIndex = m.index + m[0].length - 1
      const arg = readLiteralArg(src, quoteIndex - 1, true)
      if (!arg.key || !KEY_SHAPE.test(arg.key)) {
        continue
      }
      refs.push({ key: arg.key, file: rel, line: lineOf(m.index), source: 'route.title' })
    }
  }
}

function parseArgs() {
  const argv = process.argv.slice(2)
  let locale = 'zh-CN'
  let json = false
  let verbose = false
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--json') {
      json = true
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true
    } else if (arg.startsWith('--locale=')) {
      locale = arg.slice('--locale='.length)
    } else if (arg === '--locale') {
      locale = argv[i + 1]
      i += 1
    } else {
      console.error(`[check-locale-refs] 未知参数: ${arg}`)
      process.exit(2)
    }
  }
  return { locale, json, verbose }
}

function main() {
  const { locale, json, verbose } = parseArgs()
  const results = []

  // 框架层 key 对两端都生效
  const frameworkKeys = new Set()
  loadFrameworkKeys(locale, frameworkKeys)

  for (const app of APPS) {
    const defined = new Set(frameworkKeys)
    loadAppKeys(app, locale, defined)
    loadFlatKeys(path.join(repoRoot, app, 'src/locales/menu-titles', `${locale}.json`), defined)
    loadFlatKeys(path.join(repoRoot, app, 'src/locales/flat', `${locale}.json`), defined)

    // 语言包缺失属于配置错误，直接结束，避免把「全部 key 缺失」的噪音刷满屏
    if (process.exitCode === 2) {
      continue
    }

    const srcDir = path.join(repoRoot, app, 'src')
    const files = walkFiles(
      srcDir,
      (fp) => /\.(vue|ts)$/.test(fp) && !fp.replace(/\\/g, '/').includes('/src/locales/'),
    )
    const refs = []
    const counters = { dynamicSkipped: 0, localWrapperSkipped: 0, nonDottedSkipped: 0 }
    for (const file of files) {
      scanFile(file, refs, counters)
    }

    const missing = refs.filter((r) => !defined.has(r.key))
    const uniqueKeys = new Set(refs.map((r) => r.key))
    const sourceCounts = refs.reduce((acc, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + 1
      return acc
    }, {})
    results.push({
      app,
      definedCount: defined.size,
      scannedFiles: files.length,
      refOccurrences: refs.length,
      uniqueRefs: uniqueKeys.size,
      sourceCounts,
      missing,
      counters,
    })
  }

  // 语言包读取失败属于配置错误：只报错误原因，不再打印缺失清单
  if (process.exitCode === 2) {
    console.error('[check-locale-refs] FAILED: 语言包读取失败')
    return
  }

  // 两端同一缺失 key 合并展示时仍保留逐端（两端语言包并不完全一致）
  const totalMissing = results.reduce((n, r) => n + r.missing.length, 0)

  if (json) {
    console.log(JSON.stringify({ locale, ok: totalMissing === 0, results }, null, 2))
  } else {
    console.log(`[check-locale-refs] locale=${locale}`)
    for (const r of results) {
      const c = r.counters
      console.log(
        `[${r.app}] defined=${r.definedCount} files=${r.scannedFiles} refs=${r.refOccurrences} unique=${r.uniqueRefs} missing=${r.missing.length}`
        + `（动态跳过=${c.dynamicSkipped} 本地wrapper跳过=${c.localWrapperSkipped} 非点分跳过=${c.nonDottedSkipped}）`,
      )
      if (verbose) {
        const byKey = new Map()
        for (const ref of r.missing) {
          const list = byKey.get(ref.key) ?? []
          list.push(`${ref.file}:${ref.line}`)
          byKey.set(ref.key, list)
        }
        for (const [key, where] of byKey) {
          console.log(`  ✗ ${key}`)
          for (const w of where) {
            console.log(`      ${w}`)
          }
        }
      } else {
        for (const ref of r.missing.slice(0, 50)) {
          console.log(`  ✗ ${ref.key}  (${ref.file}:${ref.line})`)
        }
        if (r.missing.length > 50) {
          console.log(`  ... +${r.missing.length - 50} more（用 --verbose 看全部）`)
        }
      }
    }
  }

  if (totalMissing > 0) {
    console.error(`[check-locale-refs] FAILED: ${totalMissing} 处 used-but-undefined 引用`)
    process.exitCode = 1
  } else if (!json) {
    console.log('[check-locale-refs] OK: 源码引用的 key 均已定义')
  }
}

main()

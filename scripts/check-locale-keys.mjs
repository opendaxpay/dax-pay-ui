/**
 * 运营端业务语言包 key 完整性检查（相对 zh-CN）
 *
 * 用法：
 *   node scripts/check-locale-keys.mjs
 *   node scripts/check-locale-keys.mjs --langs=ja-JP,ko-KR
 *
 * 退出码：存在 missing key 时为 1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adminLocales = path.resolve(__dirname, '../apps/daxpay-admin/src/locales')
const langsRoot = path.join(adminLocales, 'langs')
const menuRoot = path.join(adminLocales, 'menu-titles')
const BASELINE = 'zh-CN'

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out)
    } else {
      out[key] = String(v ?? '')
    }
  }
  return out
}

function loadLangDir(dir) {
  const out = {}
  function walk(d, prefix = '') {
    if (!fs.existsSync(d)) return
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, ent.name)
      if (ent.isDirectory()) {
        walk(fp, prefix ? `${prefix}.${ent.name}` : ent.name)
      } else if (ent.name.endsWith('.json')) {
        const fileKey = ent.name.replace(/\.json$/, '')
        const ns = prefix ? `${prefix}.${fileKey}` : fileKey
        const json = JSON.parse(fs.readFileSync(fp, 'utf8'))
        const flat = flatten(json)
        for (const [k, v] of Object.entries(flat)) {
          out[`${ns}.${k}`] = v
        }
      }
    }
  }
  walk(dir)
  return out
}

function parseArgs() {
  const arg = process.argv.find((a) => a.startsWith('--langs='))
  if (!arg) return null
  return arg
    .slice('--langs='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const allLocales = fs
  .readdirSync(langsRoot)
  .filter((d) => fs.statSync(path.join(langsRoot, d)).isDirectory())
  .sort()

const filter = parseArgs()
const locales = filter?.length
  ? allLocales.filter((l) => filter.includes(l))
  : allLocales

const maps = {}
for (const locale of allLocales) {
  maps[locale] = loadLangDir(path.join(langsRoot, locale))
}

const baselineKeys = Object.keys(maps[BASELINE] || {}).sort()
if (!baselineKeys.length) {
  console.error(`[check-locale-keys] baseline ${BASELINE} has no keys`)
  process.exit(2)
}

console.log(`[check-locale-keys] baseline=${BASELINE} keys=${baselineKeys.length}`)
console.log(`[check-locale-keys] locales=${locales.join(', ')}`)
console.log('')

let hasMissing = false
const report = []

for (const locale of locales) {
  if (locale === BASELINE) continue
  const keys = new Set(Object.keys(maps[locale] || {}))
  const missing = baselineKeys.filter((k) => !keys.has(k))
  const extra = [...keys].filter((k) => !baselineKeys.includes(k)).sort()
  if (missing.length) hasMissing = true
  report.push({ locale, missing, extra })
  console.log(
    `[${locale}] missing=${missing.length} extra=${extra.length} total=${keys.size}`,
  )
  if (missing.length) {
    const sample = missing.slice(0, 20)
    console.log(`  missing sample (${sample.length}/${missing.length}):`)
    for (const k of sample) console.log(`    - ${k}`)
    if (missing.length > sample.length) {
      console.log(`    ... +${missing.length - sample.length} more`)
    }
  }
}

// menu-titles
console.log('')
console.log('[menu-titles]')
const menuFiles = fs
  .readdirSync(menuRoot)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort()
const menuMaps = {}
for (const locale of menuFiles) {
  menuMaps[locale] = JSON.parse(
    fs.readFileSync(path.join(menuRoot, `${locale}.json`), 'utf8'),
  )
}
const menuBaseline = Object.keys(menuMaps[BASELINE] || {}).sort()
console.log(`baseline keys=${menuBaseline.length}`)
for (const locale of menuFiles) {
  if (locale === BASELINE) continue
  if (filter?.length && !filter.includes(locale)) continue
  const missing = menuBaseline.filter((k) => !(k in (menuMaps[locale] || {})))
  if (missing.length) hasMissing = true
  console.log(`[${locale}] missing=${missing.length}`)
  for (const k of missing) console.log(`    - ${k}`)
}

console.log('')
if (hasMissing) {
  console.error('[check-locale-keys] FAILED: missing keys detected')
  process.exit(1)
}
console.log('[check-locale-keys] OK: no missing keys vs zh-CN')
process.exit(0)

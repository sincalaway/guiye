// 构建后检查扩展产物是否完整
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const required = ['manifest.json', 'index.html', 'background.js', 'icons/icon128.png']
const missing = required.filter((f) => !existsSync(resolve(dist, f)))
if (missing.length) {
  console.error('✗ 扩展产物缺少文件：', missing.join(', '))
  process.exit(1)
}
const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
if (/<script(?![^>]*\bsrc=)[^>]*>[^<]+<\/script>/i.test(html)) {
  console.error('✗ index.html 含内联脚本，MV3 不允许')
  process.exit(1)
}
const { version } = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'))
console.log(`✓ 扩展构建完成 v${version}：${dist}`)
console.log('  在 chrome://extensions 打开「开发者模式」→「加载已解压的扩展程序」→ 选择上面的目录')

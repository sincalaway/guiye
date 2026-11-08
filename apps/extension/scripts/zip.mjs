// 将 dist 打成 zip，用于上传 Chrome 网上应用店 / Edge 加载项商店
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
if (!existsSync(dist)) {
  console.error('请先运行 pnpm build:ext')
  process.exit(1)
}
const { version } = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'))
const out = resolve(root, `guiye-extension-v${version}.zip`)
rmSync(out, { force: true })
try {
  if (process.platform === 'win32') {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${out}'"`, { stdio: 'inherit' })
  } else {
    execSync(`cd "${dist}" && zip -qr "${out}" .`, { stdio: 'inherit' })
  }
  console.log(`✓ 已生成 ${out}`)
} catch {
  console.error('打包失败：请确认系统已安装 zip（Linux/macOS）或 PowerShell（Windows）')
  process.exit(1)
}

<p align="center">
  <img src="docs/assets/logo.png" alt="归页" width="160" />
</p>

<h1 align="center">归页</h1>

<p align="center">可自部署的「个人起始页 + 书签管理 + 组件式主页」。<br/>网页版、Chrome/Edge 新标签页扩展、可选多端同步，干净无广告。</p>

<p align="center"><sub>Logo：两笔墨痕，上为远山、下为书页，一点朱日，取「开卷即归处」之意。</sub></p>

技术栈：Vue 3 · Vite 7 · TypeScript · Pinia · Tailwind CSS 4 · VueUse · Lucide / Iconify · vue-draggable-plus · idb-keyval · Supabase（可选）

---

## 目录

- [安装使用（普通用户）](#安装使用普通用户)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [功能清单（已实现）](#功能清单已实现)
- [浏览器扩展打包](#浏览器扩展打包)
- [配置云同步（Supabase）](#配置云同步supabase)
- [热搜代理](#热搜代理)
- [部署](#部署)
- [第三方 API 说明](#第三方-api-说明)
- [如何新增一个卡片组件](#如何新增一个卡片组件)
- [快捷键](#快捷键)

---

## 安装使用（普通用户）

不想碰代码，直接用这两种方式之一即可。

### 方式一：浏览器扩展（推荐，替换新标签页）

1. 到 [Releases](https://github.com/sincalaway/guiye/releases/latest) 下载最新的 `guiye-extension-v*.zip`
2. 解压到一个**固定不删**的文件夹（删除后扩展失效）
3. 地址栏打开 `chrome://extensions`（Edge 为 `edge://extensions`），打开「开发者模式」
4. 点击「加载已解压的扩展程序」，选择解压后**直接包含 `manifest.json`** 的那一层文件夹
5. 打开新标签页；若浏览器询问「是否保留此更改」，选「保留」

扩展版独有：直接读取浏览器书签导入；WebApp 窗口可内嵌大多数禁止 iframe 的网站；热搜无需代理。

**更新**：下载新版 zip 覆盖原文件夹 → 在扩展管理页点归页卡片上的「刷新」按钮，数据不会丢失。
**数据迁移**：网页版与扩展数据各自本地保存。可在「设置 → 数据」导出 JSON 再导入，或两边配置同一个 Supabase 并登录自动同步。
**提示**：开发者模式扩展启动时 Chrome 可能提示「停用开发者模式扩展」，忽略即可。

### 方式二：网页版（设为浏览器主页）

自部署后（见 [部署](#部署)），把网址设为浏览器主页 / 启动页即可。

### 常用操作

- 右键图标、卡片或空白处：编辑、移动、用窗口打开、换壁纸
- `Tab` 切换搜索引擎；`Alt+M` 或双击空白处进入极简模式
- 点侧栏顶部 logo 打开「关于」，其余设置在右上角

### 维护者：发布新版本

仓库内置 GitHub Actions（`.github/workflows/release.yml`）。修改 `apps/extension/public/manifest.json` 的 `version` 后推送同名标签，会自动测试、构建扩展并把 zip 发布到 Releases：

```bash
git tag v0.1.1 && git push origin v0.1.1
```

---

## 快速开始

环境要求：Node.js ≥ 22.6，pnpm ≥ 9（`corepack enable` 即可）。

```bash
pnpm install
pnpm dev            # http://localhost:5173 ，开发服务器内置热搜代理 /api/hot
```

常用命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 本地开发（Web 版） |
| `pnpm build` | 类型检查 + 构建 Web 版到 `apps/web/dist` |
| `pnpm build:ext` | 构建浏览器扩展到 `apps/extension/dist` |
| `pnpm zip:ext` | 把扩展打成 `guiye-extension-v*.zip`，用于上架商店 |
| `pnpm build:all` | Web + 扩展一起构建 |
| `pnpm typecheck` | 只做类型检查 |
| `pnpm test` | 运行 shared 包单元测试（书签解析、数据迁移等） |

可选环境变量见 `apps/web/.env.example`（复制为 `apps/web/.env.local`）。

---

## 项目结构

```
guiye/
├── packages/shared/            # 与 UI 无关的纯逻辑（Web、扩展、代理共用）
│   ├── src/types.ts            # 数据模型 AppData / Category / GridItem / Settings …
│   ├── src/defaults/           # 配置驱动的默认数据
│   │   ├── engines.ts          #   内置搜索引擎
│   │   ├── wallpapers.ts       #   分类壁纸库
│   │   ├── sites.ts            #   图标库 / 标签库（一键添加常用网站）
│   │   └── data.ts             #   首次打开的默认布局与默认设置
│   ├── src/bookmarks.ts        # 浏览器书签 HTML 解析 / 导出（无 DOM 依赖）
│   ├── src/hot.ts              # 微博/百度/知乎热搜上游与归一化
│   ├── src/migrate.ts          # 数据校验与版本迁移（导入、同步都经过这里）
│   └── test/                   # vitest
├── apps/web/                   # Vue 应用（Web 版与扩展共用同一份代码）
│   └── src/
│       ├── stores/             # app（数据+持久化）/ ui（界面状态）/ sync（云同步）
│       ├── services/           # storage、search、weather、hot、poetry、sync、wallpaper、bookmarks
│       ├── components/
│       │   ├── layout/         # 壁纸层、时钟、搜索框、侧栏、网格、批量编辑栏
│       │   ├── dialogs/        # 添加/编辑网站、网站库、文件夹、分类编辑
│       │   ├── settings/       # 设置面板（外观/壁纸/搜索/组件/同步/备份/关于）
│       │   ├── webapp/         # 内嵌窗口与 Dock
│       │   └── common/         # Modal、右键菜单、Toast、开关、图标渲染
│       └── widgets/            # 卡片组件 + 注册表 registry.ts
├── apps/extension/             # MV3 清单、后台脚本、图标、打包脚本
├── apps/hot-proxy/             # 热搜代理（Cloudflare Worker / Node 两种）
├── supabase/schema.sql         # 云同步表结构 + RLS + 存储桶
├── deploy/                     # nginx 配置、热搜代理镜像
├── Dockerfile / docker-compose.yml
└── docs/ARCHITECTURE.md        # 架构与数据模型详解
```

---

## 功能清单（已实现）

### 1. 核心主页
- ✅ 图片 / 视频壁纸；内置分类壁纸库（山川、湖海、森林原野、城市建筑、动物、静物、动态、渐变、纯色）
- ✅ 壁纸来源：固定 / 每次打开随机（可限定分类）/ Bing 每日 / 随机摄影；一键「换一张」
- ✅ 本地上传图片/视频（存 IndexedDB）、粘贴链接、在壁纸设置页直接 Ctrl+V 粘贴图片
- ✅ 遮罩浓度、模糊度可调；壁纸加载失败自动回退
- ✅ 极简模式（只保留时间 + 搜索框），按钮 / `Alt+M` / 双击空白处切换
- ✅ 时间日期：12/24 小时制、秒、星期、农历（基于 Intl 中国历法，无额外依赖）、自定义日期格式
- ✅ 响应式：桌面左侧分类栏；手机顶部分类条、左右滑动切换分类、图标自动收紧、宽卡片占满整行

### 2. 书签与图标
- ✅ 自定义添加：网址、名称（扩展版自动抓取网页标题）、图标（自动 favicon / 文字 / 图片链接或上传 / Iconify 图标）、背景色
- ✅ 网站库：10 个分组 70+ 常用网站，搜索、一键添加、已添加标记
- ✅ 导入浏览器书签 HTML（Chrome/Edge/Firefox/Safari 导出格式），可预览勾选文件夹，按文件夹建分类或并入当前分类
- ✅ 扩展版可直接读取浏览器书签（`bookmarks` 权限）
- ✅ 图标大小 / 圆角 / 间距 / 最大宽度可调；拖拽排序（手机长按拖动）
- ✅ 多分类：新建、编辑名称和图标、拖拽排序、删除；`Alt+←/→` 切换
- ✅ 文件夹：多个网站收纳为一格，文件夹内拖拽排序、移出、解散
- ✅ 卡片式网站：1×1 图标 / 2×1 横向卡片 / 2×2 大卡片（带描述）
- ✅ 导出为浏览器可导入的书签 HTML

### 3. 搜索
- ✅ 内置百度、必应、Google、搜狗、360、DuckDuckGo、GitHub、B 站；`Tab / Shift+Tab` 切换
- ✅ 自定义搜索引擎（`%s` 占位）、拖拽排序、设默认、恢复内置
- ✅ 输入网址直接打开
- ✅ 快捷翻译（可开关）：中→英、其他→中，可复制译文或跳转翻译网站；MyMemory / Google 可选
- ✅ 搜索建议（可开关）、搜索历史（可开关，可单条删除/清空）、键盘上下选择
- ✅ 页面任意处直接打字或按 `/` 聚焦搜索框

### 4. 组件卡片（可添加 / 删除 / 拖拽 / 调整尺寸）
- ✅ 记事本：本地持久化，Markdown 预览（marked + DOMPurify 防 XSS），放大分栏编辑
- ✅ 天气：自动定位（浏览器定位 + 反向地理编码），可搜索切换城市，当前天气 + 4 日预报（4×2）
- ✅ 热搜：微博 / 百度 / 知乎一键切换，10 分钟缓存
- ✅ 日历：月历、周一开头、周末标红；4×4 尺寸显示农历
- ✅ 每日诗词 / 一言，可切换与刷新
- ✅ 时钟卡片
- ✅ 注册表架构：新增卡片只需一个 `.vue` + 注册表一行（见下文）

### 5. WebApp / 内嵌模式
- ✅ 网站可设置打开方式为「内嵌窗口」，也可右键临时选择
- ✅ 窗口可拖动、调整大小、双击标题栏全屏、最小化、刷新、在新标签打开
- ✅ 底部 Dock：显示已打开 WebApp，点击还原/最小化/置顶，右键全屏或关闭
- ✅ 扩展版通过 `declarativeNetRequest` 仅对**本扩展发起的 iframe** 去除 `X-Frame-Options`/CSP，绝大多数网站可内嵌；Web 版受浏览器限制，禁止内嵌的网站会提示改用新标签打开

### 6. 数据同步与备份
- ✅ 本地优先：数据存 IndexedDB（并镜像到 localStorage 秒开），上传文件存 IndexedDB Blob
- ✅ 同一浏览器多个新标签页之间实时同步（BroadcastChannel）
- ✅ JSON 备份导出 / 导入（导入时自动校验与迁移）
- ✅ Supabase 云同步：邮箱+密码 或 邮箱验证码登录；书签、布局、壁纸（本地上传的会传到你的 Storage）、记事本、设置全部同步；修改后 2 秒自动推送，Realtime 推送其他设备变更；支持手动「本机覆盖云端 / 云端覆盖本机」
- ✅ 支持自定义 Supabase 地址（自建实例），也可构建时内置

### 7. 体验细节
- ✅ 右键菜单：图标（打开方式、编辑、尺寸、移动到、放入文件夹、复制链接、删除）、组件、文件夹、分类、空白处、Dock
- ✅ 批量编辑：多选、全选、批量移动、批量建文件夹、批量删除
- ✅ 设置面板：外观、壁纸、搜索、组件、同步、书签与备份、关于（含快捷键）
- ✅ 亮色 / 暗色 / 跟随系统
- ✅ 首屏只加载核心代码（gzip 约 110KB）；卡片组件、Supabase SDK 按需懒加载

### 暂未实现 / 后续迭代建议
- 云同步为整份快照「最后写入胜出」，暂无字段级合并
- 卡片之间的跨分类拖拽（目前用右键「移动到」/ 批量移动）
- 更多卡片：待办、倒计时、RSS、汇率、GitHub 贡献图等（架构已就绪）
- i18n 多语言、PWA 离线安装

---

## 浏览器扩展打包

```bash
pnpm install
pnpm build:ext       # 产物：apps/extension/dist
pnpm zip:ext         # 产物：apps/extension/guiye-extension-v0.1.0.zip
```

**本地加载（Chrome / Edge）**

1. 打开 `chrome://extensions`（Edge 为 `edge://extensions`）
2. 打开右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择 `apps/extension/dist`
4. 打开新标签页即为归页（首次 Chrome 会询问是否保留新标签页更改，选「保留」）

**上架商店**：把 `pnpm zip:ext` 生成的 zip 上传到 Chrome Web Store 开发者后台 / Edge 加载项合作伙伴中心。修改版本号请改 `apps/extension/public/manifest.json` 的 `version`。

**扩展权限说明**

| 权限 | 用途 |
| --- | --- |
| `chrome_url_overrides.newtab` | 替换新标签页 |
| `storage` | 预留（数据实际存 IndexedDB） |
| `bookmarks` | 「直接读取浏览器书签」导入 |
| `favicon` | 「浏览器缓存」图标来源，离线也能显示网站图标 |
| `declarativeNetRequest` + `<all_urls>` | WebApp 内嵌、搜索建议与热搜跨域请求、自动抓取网页标题 |

---

## 配置云同步（Supabase）

同步完全可选；不配置时一切数据只在本机。

1. 在 [supabase.com](https://supabase.com) 免费注册并新建项目（免费额度：500MB 数据库、1GB 文件存储，个人使用足够）。也可以[自建 Supabase](https://supabase.com/docs/guides/self-hosting)。
2. 打开项目 → **SQL Editor**，粘贴并执行 [`supabase/schema.sql`](supabase/schema.sql)。它会创建：
   - `guiye_snapshots` 表（每用户一行，开启 RLS，只能读写自己的数据）
   - Realtime 发布（其他设备修改后实时推送）
   - `guiye-wallpapers` 公开存储桶（只允许用户上传到自己的目录）
3. **Project Settings → API**，复制 `Project URL` 与 `anon public` key。
4. 二选一：
   - 构建时内置：写入 `apps/web/.env.local` 的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，再 `pnpm build` / `pnpm build:ext`
   - 运行时填写：归页 → 设置 → 同步 → 自定义同步服务
5. **Authentication → Providers → Email** 保持开启。想用「邮箱验证码」登录，在 **Authentication → Email Templates → Magic Link** 模板中加入 `{{ .Token }}` 以显示 6 位验证码（扩展环境推荐验证码，不依赖回跳链接）。如果不想要注册邮件确认，可关闭 *Confirm email*。
6. Web 版部署后，把你的站点地址加到 **Authentication → URL Configuration → Site URL / Redirect URLs**。

> anon key 是公开密钥，配合 RLS 使用是安全的；**切勿**把 `service_role` key 放进前端。

**同步策略**：每份数据带 `updatedAt`。登录 / 启动时比较本机与云端，较新的一方覆盖另一方；本机修改后 2 秒防抖推送；同步配置本身（Supabase 地址等）只保存在本机，不会上传。

---

## 热搜代理

微博、百度、知乎的接口不支持浏览器跨域，所以：

| 运行环境 | 默认行为（「热搜 API 地址」留空时） |
| --- | --- |
| `pnpm dev` | Vite 开发服务器内置 `/api/hot/:source` 代理 |
| 浏览器扩展 | 直接请求上游（`host_permissions` 绕过 CORS，并带上你的登录 Cookie） |
| Docker 部署 | Nginx 把 `/api/hot/` 反代到 `hot` 容器 |
| 纯静态托管 | 需在「设置 → 组件 → 热搜 API 地址」填写下列任一服务 |

可选的代理服务（返回格式 `{ code: 200, data: [{ title, url, hot }] }`，与 [DailyHotApi](https://github.com/imsyy/DailyHotApi) 兼容）：

- **Cloudflare Worker**（免费）：`cd apps/hot-proxy && npx wrangler deploy`，得到 `https://guiye-hot.<你的子域>.workers.dev`
- **Node**：`pnpm --filter @guiye/hot-proxy start`（默认端口 8787，可设 `PORT`）
- 自建 DailyHotApi，填写其地址即可

> 注意：知乎、微博对海外 / 机房 IP 有反爬限制，代理部署在海外时这两个源可能失败（百度通常可用）。部署在国内服务器或使用扩展版效果最好。

---

## 部署

Web 版是纯静态站点（`apps/web/dist`），任何静态托管都能用。

**Docker（含热搜代理，推荐）**

```bash
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... docker compose up -d --build
# 打开 http://localhost:8080
```

**Vercel / Netlify / Cloudflare Pages**

- 根目录：仓库根；构建命令：`pnpm install && pnpm build`；输出目录：`apps/web/dist`
- 环境变量按需设置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_HOT_API_BASE`（指向你的 hot-proxy）

**Nginx / 宝塔**：把 `apps/web/dist` 上传到站点目录，参考 `deploy/nginx.conf`。

**设为浏览器主页**：部署后在浏览器设置「启动时打开特定网页 / 主页」填入你的地址。

---

## 第三方 API 说明

全部为免费接口，**无需申请 key**：

| 服务 | 用途 | 说明与注意 |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | 天气、城市搜索 | 免费非商用，每日 1 万次；支持 CORS |
| [BigDataCloud reverse-geocode-client](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) | 定位后显示城市名 | 仅限客户端使用，免费 |
| [今日诗词 v1](https://www.jinrishici.com) | 每日诗词 | `v1.jinrishici.com/all.json` 免 token |
| [Hitokoto 一言](https://developer.hitokoto.cn) | 一言 | 免费，有 QPS 限制 |
| [MyMemory](https://mymemory.translated.net/doc/spec.php) | 快捷翻译 | 匿名每 IP 每日约 5000 字；在请求中加 `&de=你的邮箱` 可提升到 5 万字 |
| Google Translate (gtx) | 快捷翻译（可选） | 非官方免费端点，国内不可用，可能被限流 |
| 百度 / Google 建议 | 搜索建议 | Web 版用百度 JSONP；扩展版用 fetch |
| [icon.horse](https://icon.horse) / Google / DuckDuckGo | 网站图标 | 设置中可切换；国内网络推荐 icon.horse 或扩展「浏览器缓存」 |
| [Picsum](https://picsum.photos) | 壁纸库与随机图 | 图片来自 Unsplash，免费可商用 |
| [bing.biturl.top](https://github.com/TimothyYe/bing-wallpaper) | Bing 每日壁纸 | 第三方开源代理，可自建 |
| MDN CC0 视频 | 动态壁纸示例 | CC0 授权 |
| 微博 / 百度 / 知乎 | 热搜 | 非公开接口，可能变化；变化时只需修改 `packages/shared/src/hot.ts` |

---

## 如何新增一个卡片组件

1. 在 `apps/web/src/widgets/` 新建 `TodoWidget.vue`：

   ```vue
   <script setup lang="ts">
   import type { WidgetItem } from '@guiye/shared'
   import WidgetShell from './WidgetShell.vue'
   // item.config 是这个卡片自己的配置，直接修改即可自动保存与同步
   const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
   </script>
   <template>
     <WidgetShell title="待办">…</WidgetShell>
   </template>
   ```

2. 在 `apps/web/src/widgets/registry.ts` 的 `WIDGETS` 中加一项（名称、图标、可选尺寸、默认配置、懒加载组件）。

完成。它会自动出现在「添加 → 组件」与设置面板里，支持拖拽、右键改尺寸、删除、同步。

---

## 快捷键

| 按键 | 作用 |
| --- | --- |
| `Tab` / `Shift+Tab` | 搜索框内切换搜索引擎 |
| `/` 或直接打字 | 聚焦搜索框 |
| `↑` `↓` `Enter` | 选择搜索建议 / 历史 |
| `Alt+M` / 双击空白 | 极简模式 |
| `Alt+←` / `Alt+→` | 切换分类 |
| `Alt+E` | 批量编辑 |
| `Ctrl/⌘ + 点击` / 鼠标中键 | 强制新标签页打开 |
| `Esc` | 关闭弹窗 / 退出批量编辑 |

---

## License

MIT

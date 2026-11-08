# 归页 架构与数据模型

## 总体分层

```
┌──────────────────────── apps/web (Vue 3) ────────────────────────┐
│  components/  ← 只负责渲染与交互                                    │
│      │ 读写                                                         │
│  stores/app   ← 唯一数据源 AppData，deep watch → 防抖持久化          │
│  stores/ui    ← 弹窗、右键菜单、批量选择、WebApp 窗口（不持久化）     │
│  stores/sync  ← 订阅 app 的本地修改 → Supabase；Realtime → 拉取       │
│      │                                                             │
│  services/    ← 与外部世界打交道：IndexedDB、天气、热搜、翻译…        │
└──────────────────────────────┬───────────────────────────────────┘
                               │ import
                  packages/shared（纯 TS，无 DOM / 无 Vue）
          类型 · 默认配置 · 书签解析 · 热搜归一化 · 数据迁移
                               │ import
                apps/hot-proxy（Worker / Node） · vite dev 中间件
```

- **同一份前端代码**输出两个目标：`vite build`（Web，`base: /`）与 `vite build --mode extension`（扩展，`base: ./`，publicDir 换成 `apps/extension/public`，带 manifest 与后台脚本）。运行时用 `IS_EXTENSION` 区分少数行为（搜索建议用 fetch 而非 JSONP、热搜直连、可读取浏览器书签、favicon 可用浏览器缓存）。
- **配置驱动**：搜索引擎、壁纸库、网站库、默认布局、卡片注册表都是数据，改数组即可。

## 数据模型（`packages/shared/src/types.ts`）

```ts
AppData {
  schemaVersion, updatedAt, deviceId
  categories: Category[]          // 侧栏上的每一页
  activeCategoryId
  settings: Settings              // 主题、极简、布局、时钟、搜索、壁纸、同步…
  notes: Note[]                   // 记事本内容（卡片通过 noteId 引用）
  searchHistory: string[]
}

Category { id, name, icon, items: GridItem[] }

GridItem =
  | SiteItem   { type:'site',   title, url, icon: IconSpec, bgColor?, description?, openMode?, size }
  | FolderItem { type:'folder', title, children: SiteItem[], size:'1x1' }
  | WidgetItem { type:'widget', widget: 'notes'|'weather'|…, config: {...}, size }

size: '1x1' | '2x1' | '2x2' | '2x4' | '4x2' | '4x4'   // 列×行，映射到 CSS Grid span
IconSpec: favicon | url(远程/data:/idb:) | text | iconify
Wallpaper { type: image|video|color|gradient, value, thumb?, credit? }
```

设计要点：

1. **一棵可序列化的树**：导出、导入、同步、跨标签页广播都以 AppData 整体为单位，简单可靠。
2. **二进制与结构分离**：本地上传的图片/视频存 IndexedDB（`guiye-blobs`），树里只放 `idb:<key>` 引用；同步时上传到 Supabase Storage 并替换为公开地址（本机缓存映射，避免重复上传）。
3. **向前兼容**：任何来源的数据都经过 `migrateData()`：以默认值为骨架深合并、补全缺字段、修正非法的 activeCategoryId / engineId。以后改结构只需提升 `SCHEMA_VERSION` 并在此处加迁移。
4. **本机专属字段**：`settings.sync`（Supabase 地址等）、`deviceId`、上次同步时间只属于本机，替换数据时保留、推送时清空。

## 持久化与同步流程

```
修改 → Pinia(data) ─deep watch→ updatedAt=now ─300ms→ IndexedDB + localStorage
                                              ├→ BroadcastChannel（同浏览器其他新标签页重新载入）
                                              └→ onLocalChange → sync 2s 防抖 → upsert guiye_snapshots
其他设备 upsert → Realtime → updatedAt 更新且 deviceId≠本机 → pull → replaceData(external)
```

`replaceData(..., external=true)` 不会刷新 updatedAt，也不会触发推送与广播，避免回环。

## 网格与拖拽

- CSS Grid：`grid-template-columns: repeat(auto-fill, var(--cell-w))`、`grid-auto-rows: var(--cell-h)`、`grid-auto-flow: dense`，每项用 `span` 占位，图标与卡片自然混排。
- 尺寸、圆角、间距全部是 CSS 变量，设置面板的滑块实时生效；手机端在 `GridView` 中自动收紧，4 列宽卡片改为整行。
- `vue-draggable-plus` 直接 `v-model` 绑定当前分类的 `items` 数组，排序即保存。

## WebApp 内嵌

- 窗口状态在 `ui.windows`（位置、尺寸、z 序、normal/min/max），最小化用 `v-show` 保留 iframe 状态。
- 扩展后台在安装/启动时注册一条 `declarativeNetRequest` 动态规则：仅当 `initiatorDomains` 为本扩展 id 且资源类型为 `sub_frame` 时移除 `X-Frame-Options` 与 CSP 头，不影响正常浏览。

## 扩展 CSP

MV3 禁止远程与内联脚本：Vite 产物只有外链 module 脚本；JSONP 只在 Web 版使用；构建后 `scripts/check.mjs` 会检查 `index.html` 是否含内联脚本。

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Upload } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { hostnameOf, isProbablyUrl, normalizeUrl, site, type IconSpec, type ItemSize, type OpenMode, type SiteItem } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { fetchPageTitle } from '@/services/search'
import { putBlob } from '@/services/storage'

const app = useAppStore()
const ui = useUiStore()
const editing = computed(() => ui.siteEditor.item)

type IconKind = IconSpec['kind']
const form = reactive({
  url: '',
  title: '',
  description: '',
  iconKind: 'favicon' as IconKind,
  iconValue: '',
  bgColor: '',
  size: '1x1' as ItemSize,
  openMode: '' as OpenMode | '',
  categoryId: '',
})
const fetchingTitle = ref(false)

watch(
  () => ui.siteEditor.open,
  (open) => {
    if (!open) return
    const it = ui.siteEditor.item
    Object.assign(form, {
      url: it?.url ?? '',
      title: it?.title ?? '',
      description: it?.description ?? '',
      iconKind: it?.icon.kind ?? 'favicon',
      iconValue: it && 'value' in it.icon ? it.icon.value : '',
      bgColor: it?.bgColor ?? '',
      size: it?.size ?? '1x1',
      openMode: it?.openMode ?? '',
      categoryId: ui.siteEditor.categoryId ?? app.data.activeCategoryId,
    })
  },
)

const icon = computed<IconSpec>(() => (form.iconKind === 'favicon' ? { kind: 'favicon' } : { kind: form.iconKind, value: form.iconValue } as IconSpec))
const preview = computed(() => ({ url: normalizeUrl(form.url || 'example.com'), title: form.title || hostnameOf(form.url) || '网站', icon: icon.value, bgColor: form.bgColor || undefined }))

async function onUrlBlur() {
  if (!form.url.trim()) return
  form.url = normalizeUrl(form.url)
  if (form.title) return
  fetchingTitle.value = true
  const t = await fetchPageTitle(form.url)
  fetchingTitle.value = false
  form.title = t || hostnameOf(form.url).replace(/^www\./, '').split('.')[0] || ''
}

async function onUpload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (f.size > 2 * 1024 * 1024) return ui.toast('图标图片请小于 2MB', 'error')
  // 小图转 data URL，方便同步；大图存 IndexedDB
  if (f.size < 200 * 1024) {
    form.iconValue = await new Promise<string>((r) => {
      const fr = new FileReader()
      fr.onload = () => r(String(fr.result))
      fr.readAsDataURL(f)
    })
  } else form.iconValue = await putBlob(f)
  form.iconKind = 'url'
}

function save() {
  if (!form.url.trim() || !isProbablyUrl(form.url) && !/^[a-z]+:/i.test(form.url)) return ui.toast('请输入有效的网址', 'error')
  const patch: Partial<SiteItem> = {
    url: normalizeUrl(form.url),
    title: form.title.trim() || hostnameOf(form.url),
    description: form.description.trim() || undefined,
    icon: icon.value,
    bgColor: form.bgColor || undefined,
    size: form.size,
    openMode: form.openMode || undefined,
  }
  if (editing.value) {
    app.updateItem(editing.value.id, patch)
  } else {
    app.addItem(site(patch.title!, patch.url!, patch), form.categoryId)
    ui.toast(`已添加「${patch.title}」`, 'success')
  }
  ui.siteEditor.open = false
}

const KINDS: { v: IconKind; l: string }[] = [
  { v: 'favicon', l: '自动获取' },
  { v: 'text', l: '文字' },
  { v: 'url', l: '图片' },
  { v: 'iconify', l: 'Iconify' },
]
const COLORS = ['', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#111827', '#ffffff']
</script>

<template>
  <Modal :open="ui.siteEditor.open" :title="editing ? '编辑图标' : '添加网站'" width="560px" @close="ui.siteEditor.open = false">
    <div class="flex flex-col gap-4 sm:flex-row">
      <div class="flex shrink-0 flex-col items-center gap-2 sm:w-28">
        <div class="h-[72px] w-[72px] overflow-hidden shadow-lg" :style="{ borderRadius: `${app.settings.layout.iconRadius}%` }">
          <SiteIcon :item="preview" :size="72" />
        </div>
        <span class="max-w-full truncate text-xs text-zinc-500">{{ preview.title }}</span>
      </div>
      <div class="flex flex-1 flex-col gap-3">
        <div>
          <label class="gy-label">网址</label>
          <input v-model="form.url" class="gy-input" placeholder="https://example.com" autofocus @blur="onUrlBlur" @keydown.enter="onUrlBlur" />
        </div>
        <div>
          <label class="gy-label">名称 <span v-if="fetchingTitle" class="text-zinc-400">（获取标题中…）</span></label>
          <input v-model="form.title" class="gy-input" placeholder="网站名称" maxlength="40" />
        </div>
        <div>
          <label class="gy-label">图标</label>
          <div class="mb-2 flex flex-wrap gap-1">
            <button
              v-for="k in KINDS"
              :key="k.v"
              class="rounded-md px-2.5 py-1 text-xs"
              :class="form.iconKind === k.v ? 'bg-brand-500 text-white' : 'bg-black/5 dark:bg-white/10'"
              @click="form.iconKind = k.v"
            >
              {{ k.l }}
            </button>
          </div>
          <input v-if="form.iconKind === 'text'" v-model="form.iconValue" class="gy-input" maxlength="2" placeholder="1~2 个字，留空取名称首字" />
          <div v-else-if="form.iconKind === 'url'" class="flex gap-2">
            <input v-model="form.iconValue" class="gy-input" placeholder="图片地址 https://..." />
            <label class="gy-btn-ghost shrink-0 cursor-pointer"><Upload :size="15" />上传<input type="file" accept="image/*" class="hidden" @change="onUpload" /></label>
          </div>
          <input v-else-if="form.iconKind === 'iconify'" v-model="form.iconValue" class="gy-input" placeholder="如 mdi:github、logos:vue，见 icones.js.org" />
        </div>
        <div>
          <label class="gy-label">背景色</label>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="c in COLORS"
              :key="c"
              class="h-6 w-6 rounded-full border border-black/10"
              :class="{ 'ring-2 ring-brand-500 ring-offset-1': form.bgColor === c }"
              :style="{ background: c || 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }"
              :title="c || '自动'"
              @click="form.bgColor = c"
            />
            <input v-model="form.bgColor" type="color" class="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="gy-label">样式</label>
            <select v-model="form.size" class="gy-input">
              <option value="1x1">图标</option>
              <option value="2x1">横向卡片</option>
              <option value="2x2">大卡片</option>
            </select>
          </div>
          <div>
            <label class="gy-label">打开方式</label>
            <select v-model="form.openMode" class="gy-input">
              <option value="">跟随全局设置</option>
              <option value="newTab">新标签页</option>
              <option value="self">当前页</option>
              <option value="webapp">内嵌窗口（WebApp）</option>
            </select>
          </div>
        </div>
        <div v-if="form.size !== '1x1'">
          <label class="gy-label">描述（卡片显示）</label>
          <input v-model="form.description" class="gy-input" maxlength="80" />
        </div>
        <div v-if="!editing">
          <label class="gy-label">添加到分类</label>
          <select v-model="form.categoryId" class="gy-input">
            <option v-for="c in app.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="gy-btn-ghost" @click="ui.siteEditor.open = false">取消</button>
      <button class="gy-btn-primary" @click="save">保存</button>
    </template>
  </Modal>
</template>

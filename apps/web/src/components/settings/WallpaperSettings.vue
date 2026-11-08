<script setup lang="ts">
import { computed, ref } from 'vue'
import { Upload, Link2, Trash2, Shuffle } from 'lucide-vue-next'
import { WALLPAPER_LIBRARY, type Wallpaper, type WallpaperSource } from '@guiye/shared'
import WallpaperThumb from './WallpaperThumb.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useWallpaper } from '@/composables/useWallpaper'
import { guessWallpaperType, wallpaperFromClipboard, wallpaperFromFile } from '@/services/wallpaper'
import { deleteBlob } from '@/services/storage'

const app = useAppStore()
const ui = useUiStore()
const wp = useWallpaper()
const s = computed(() => app.settings.wallpaper)
const cat = ref(WALLPAPER_LIBRARY[0]!.id)
const link = ref('')
const items = computed(() => (cat.value === 'custom' ? s.value.custom : (WALLPAPER_LIBRARY.find((c) => c.id === cat.value)?.items ?? [])))

const SOURCES: { v: WallpaperSource; l: string; d: string }[] = [
  { v: 'fixed', l: '固定', d: '始终显示选中的壁纸' },
  { v: 'random-library', l: '随机', d: '每次打开从壁纸库随机' },
  { v: 'bing-daily', l: 'Bing 每日', d: '每天一张必应美图' },
  { v: 'picsum-random', l: '随机摄影', d: 'Picsum 随机图片' },
]

function addCustom(w: Wallpaper) {
  if (!s.value.custom.some((x) => x.value === w.value)) s.value.custom.unshift(w)
  wp.set(w)
  cat.value = 'custom'
  ui.toast('壁纸已应用', 'success')
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!f) return
  try {
    addCustom(await wallpaperFromFile(f))
  } catch (err: any) {
    ui.toast(err.message, 'error')
  }
}

function addLink() {
  const v = link.value.trim()
  if (!/^https?:\/\//i.test(v)) return ui.toast('请输入 http(s) 开头的图片或视频链接', 'error')
  addCustom({ type: guessWallpaperType(v), value: v })
  link.value = ''
}

async function onPaste(e: ClipboardEvent) {
  const w = await wallpaperFromClipboard(e)
  if (w) {
    e.preventDefault()
    addCustom(w)
  }
}

async function removeCustom(w: Wallpaper) {
  s.value.custom = s.value.custom.filter((x) => x.value !== w.value)
  if (s.value.current.value !== w.value) await deleteBlob(w.value)
}
</script>

<template>
  <section class="space-y-5" @paste="onPaste">
    <div class="flex gap-4">
      <div class="w-48 shrink-0">
        <WallpaperThumb v-if="wp.session.value" :w="wp.session.value" />
        <button class="gy-btn-ghost mt-2 w-full !py-1.5" @click="wp.next()"><Shuffle :size="14" />换一张</button>
      </div>
      <div class="flex-1 space-y-3">
        <div>
          <label class="gy-label">遮罩：{{ Math.round(s.mask * 100) }}%</label>
          <input v-model.number="s.mask" type="range" min="0" max="0.8" step="0.05" class="w-full accent-brand-500" />
        </div>
        <div>
          <label class="gy-label">模糊：{{ s.blur }}px</label>
          <input v-model.number="s.blur" type="range" min="0" max="30" class="w-full accent-brand-500" />
        </div>
      </div>
    </div>

    <div>
      <h3 class="mb-2 text-sm font-semibold">壁纸来源</h3>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-for="o in SOURCES"
          :key="o.v"
          class="rounded-lg border px-3 py-2 text-left"
          :class="s.source === o.v ? 'border-brand-500 bg-brand-500/10' : 'border-black/10 dark:border-white/10'"
          @click="s.source = o.v"
        >
          <div class="text-sm font-medium">{{ o.l }}</div>
          <div class="text-[11px] text-zinc-500">{{ o.d }}</div>
        </button>
      </div>
      <div v-if="s.source === 'random-library'" class="mt-2">
        <label class="gy-label">随机范围</label>
        <select v-model="s.randomCategory" class="gy-input">
          <option value="">全部分类</option>
          <option v-for="c in WALLPAPER_LIBRARY.filter((c) => c.items.some((i) => i.type === 'image'))" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <div>
      <h3 class="mb-2 text-sm font-semibold">自定义壁纸</h3>
      <div class="flex flex-wrap gap-2">
        <label class="gy-btn-ghost cursor-pointer"><Upload :size="15" />上传图片/视频<input type="file" accept="image/*,video/*" class="hidden" @change="onFile" /></label>
        <div class="flex min-w-60 flex-1 gap-2">
          <input v-model="link" class="gy-input" placeholder="粘贴图片或视频链接（.mp4/.webm）" @keydown.enter="addLink" />
          <button class="gy-btn-ghost shrink-0" @click="addLink"><Link2 :size="15" />使用</button>
        </div>
      </div>
      <p class="mt-1 text-xs text-zinc-400">也可以在本页直接 Ctrl+V 粘贴图片。上传的文件保存在本机 IndexedDB，登录同步后会上传到你的云存储。</p>
    </div>

    <div>
      <div class="no-scrollbar mb-3 flex gap-1 overflow-x-auto">
        <button
          v-for="c in [...WALLPAPER_LIBRARY.map((c) => ({ id: c.id, name: c.name })), { id: 'custom', name: `我的 (${s.custom.length})` }]"
          :key="c.id"
          class="shrink-0 rounded-full px-3 py-1 text-xs"
          :class="cat === c.id ? 'bg-brand-500 text-white' : 'bg-black/5 dark:bg-white/10'"
          @click="cat = c.id"
        >
          {{ c.name }}
        </button>
      </div>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <div v-for="w in items" :key="w.value" class="group relative cursor-pointer" @click="wp.set(w)">
          <WallpaperThumb :w="w" :active="s.source === 'fixed' && s.current.value === w.value" />
          <button
            v-if="cat === 'custom'"
            class="absolute top-1 right-1 hidden rounded bg-black/50 p-1 text-white group-hover:block"
            title="删除"
            @click.stop="removeCustom(w)"
          >
            <Trash2 :size="12" />
          </button>
        </div>
        <p v-if="!items.length" class="col-span-full py-6 text-center text-sm text-zinc-400">还没有自定义壁纸</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 在线壁纸窗口（子幽样式）：左侧分类栏（各壁纸分类 + 随机API），底部「自定义壁纸」；右侧缩略图网格。
 */
import { computed, ref } from 'vue'
import { Upload, Link2, Trash2, ImagePlus, Shuffle } from 'lucide-vue-next'
import { WALLPAPER_LIBRARY, type Wallpaper, type WallpaperSource } from '@guiye/shared'
import Modal from '@/components/common/Modal.vue'
import WallpaperThumb from './WallpaperThumb.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useWallpaper } from '@/composables/useWallpaper'
import { guessWallpaperType, wallpaperFromClipboard, wallpaperFromFile } from '@/services/wallpaper'
import { deleteBlob } from '@/services/storage'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()
const app = useAppStore()
const ui = useUiStore()
const wp = useWallpaper()
const s = computed(() => app.settings.wallpaper)
const cat = ref(WALLPAPER_LIBRARY[0]!.id)
const link = ref('')
const items = computed(() => WALLPAPER_LIBRARY.find((c) => c.id === cat.value)?.items ?? [])

const SOURCES: { v: WallpaperSource; l: string; d: string }[] = [
  { v: 'random-library', l: '随机壁纸', d: '每次打开从壁纸库随机一张' },
  { v: 'bing-daily', l: 'Bing 每日', d: '每天一张必应美图' },
  { v: 'picsum-random', l: '随机摄影', d: 'Picsum 随机图片' },
  { v: 'fixed', l: '固定壁纸', d: '始终显示选中的壁纸' },
]

function pick(w: Wallpaper) {
  wp.set(w)
  ui.toast('壁纸已应用', 'success')
}
function addCustom(w: Wallpaper) {
  if (!s.value.custom.some((x) => x.value === w.value)) s.value.custom.unshift(w)
  pick(w)
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
  if (w) (e.preventDefault(), addCustom(w))
}
async function removeCustom(w: Wallpaper) {
  s.value.custom = s.value.custom.filter((x) => x.value !== w.value)
  if (s.value.current.value !== w.value) await deleteBlob(w.value)
}
const railCls = (on: boolean) => (on ? 'bg-white font-medium text-[#1677ff] shadow-sm dark:bg-zinc-700 dark:text-sky-300' : 'text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5')
</script>

<template>
  <Modal :open="open" title="壁纸" width="880px" body-class="p-0" @close="$emit('close')">
    <div class="flex h-[min(560px,72vh)]" @paste="onPaste">
      <nav class="flex w-[140px] shrink-0 flex-col gap-0.5 bg-[#f7f8fa] p-2 text-[13px] dark:bg-zinc-800/60">
        <button v-for="c in WALLPAPER_LIBRARY" :key="c.id" class="rounded-lg px-3 py-2 text-left" :class="railCls(cat === c.id)" @click="cat = c.id">{{ c.name }}</button>
        <button class="rounded-lg px-3 py-2 text-left" :class="railCls(cat === 'random')" @click="cat = 'random'">随机API</button>
        <button class="mt-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-left" :class="railCls(cat === 'custom')" @click="cat = 'custom'"><ImagePlus :size="15" />自定义壁纸</button>
      </nav>

      <div class="scrollbar-thin min-w-0 flex-1 overflow-y-auto p-4">
        <!-- 随机API -->
        <div v-if="cat === 'random'" class="grid grid-cols-2 gap-3">
          <button
            v-for="o in SOURCES"
            :key="o.v"
            class="rounded-lg border px-4 py-3 text-left"
            :class="s.source === o.v ? 'border-[#1677ff] bg-[#1677ff]/5' : 'border-black/10 hover:border-[#1677ff]/50 dark:border-white/10'"
            @click="(s.source = o.v), o.v !== 'fixed' && wp.next()"
          >
            <div class="flex items-center gap-1.5 text-sm font-medium"><Shuffle v-if="o.v !== 'fixed'" :size="14" />{{ o.l }}</div>
            <div class="mt-0.5 text-xs text-zinc-500">{{ o.d }}</div>
          </button>
          <div v-if="s.source === 'random-library'" class="col-span-2">
            <label class="gy-label">随机范围</label>
            <select v-model="s.randomCategory" class="gy-input">
              <option value="">全部分类</option>
              <option v-for="c in WALLPAPER_LIBRARY.filter((c) => c.items.some((i) => i.type === 'image'))" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <!-- 自定义壁纸 -->
        <div v-else-if="cat === 'custom'" class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <label class="gy-btn-ghost cursor-pointer"><Upload :size="15" />上传图片/视频<input type="file" accept="image/*,video/*" class="hidden" @change="onFile" /></label>
            <div class="flex min-w-60 flex-1 gap-2">
              <input v-model="link" class="gy-input" placeholder="粘贴图片或视频链接（.mp4/.webm）" @keydown.enter="addLink" />
              <button class="gy-btn-ghost shrink-0" @click="addLink"><Link2 :size="15" />使用</button>
            </div>
          </div>
          <p class="text-xs text-zinc-400">也可以直接 Ctrl+V 粘贴图片。上传的文件保存在本机，登录同步后会上传到你的云存储。</p>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="w in s.custom" :key="w.value" class="group relative cursor-pointer" @click="pick(w)">
              <WallpaperThumb :w="w" :active="s.source === 'fixed' && s.current.value === w.value" />
              <button class="absolute top-1 right-1 hidden rounded bg-black/50 p-1 text-white group-hover:block" title="删除" @click.stop="removeCustom(w)"><Trash2 :size="12" /></button>
            </div>
          </div>
          <p v-if="!s.custom.length" class="py-6 text-center text-sm text-zinc-400">还没有自定义壁纸</p>
        </div>

        <!-- 分类壁纸 -->
        <div v-else class="grid grid-cols-3 gap-3">
          <div v-for="w in items" :key="w.value" class="cursor-pointer" @click="(s.source = 'fixed'), pick(w)">
            <WallpaperThumb :w="w" :active="s.source === 'fixed' && s.current.value === w.value" />
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

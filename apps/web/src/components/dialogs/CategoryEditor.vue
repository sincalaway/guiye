<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { CATEGORY_ICONS, CATEGORY_COLORS, categoryColor } from '@/utils/categoryIcons'

const app = useAppStore()
const ui = useUiStore()
const name = ref('')
const icon = ref('folder')
const color = ref<string | undefined>()

watch(
  () => ui.categoryEditor.open,
  (open) => {
    if (!open) return
    const c = app.categories.find((x) => x.id === ui.categoryEditor.id)
    name.value = c?.name ?? ''
    icon.value = c?.icon ?? 'folder'
    color.value = c?.color
  },
)

function save() {
  const n = name.value.trim()
  if (!n) return ui.toast('请输入分类名称', 'error')
  if (ui.categoryEditor.id) app.updateCategory(ui.categoryEditor.id, { name: n, icon: icon.value, color: color.value })
  else {
    const c = app.addCategory(n, icon.value)
    if (color.value) app.updateCategory(c.id, { color: color.value })
    app.setActiveCategory(c.id)
  }
  ui.categoryEditor.open = false
}
</script>

<template>
  <Modal :open="ui.categoryEditor.open" :title="ui.categoryEditor.id ? '编辑分类' : '新建分类'" width="420px" @close="ui.categoryEditor.open = false">
    <label class="gy-label">名称</label>
    <input v-model="name" class="gy-input mb-4" maxlength="12" placeholder="如：工作、学习" autofocus @keydown.enter="save" />
    <label class="gy-label">图标</label>
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="(comp, key) in CATEGORY_ICONS"
        :key="key"
        class="flex aspect-square items-center justify-center rounded-lg"
        :class="icon === key ? 'bg-brand-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'"
        @click="icon = key"
      >
        <component :is="comp" :size="18" />
      </button>
    </div>
    <label class="gy-label mt-4">颜色</label>
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="h-7 rounded-full border border-zinc-300 px-2.5 text-xs dark:border-zinc-600"
        :class="!color ? 'ring-2 ring-brand-500' : ''"
        title="按图标自动取色"
        @click="color = undefined"
      >
        自动
      </button>
      <button
        v-for="c in CATEGORY_COLORS"
        :key="c"
        class="h-7 w-7 rounded-full transition hover:scale-110"
        :class="color === c ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-zinc-900' : ''"
        :style="{ background: c }"
        @click="color = c"
      />
      <span class="ml-auto flex h-8 w-8 items-center justify-center rounded-[10px] text-white shadow" :style="{ background: categoryColor({ icon, color }) }">
        <component :is="CATEGORY_ICONS[icon]" :size="18" />
      </span>
    </div>
    <template #footer>
      <button class="gy-btn-ghost" @click="ui.categoryEditor.open = false">取消</button>
      <button class="gy-btn-primary" @click="save">保存</button>
    </template>
  </Modal>
</template>

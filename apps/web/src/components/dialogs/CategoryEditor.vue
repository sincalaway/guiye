<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { CATEGORY_ICONS } from '@/utils/categoryIcons'

const app = useAppStore()
const ui = useUiStore()
const name = ref('')
const icon = ref('folder')

watch(
  () => ui.categoryEditor.open,
  (open) => {
    if (!open) return
    const c = app.categories.find((x) => x.id === ui.categoryEditor.id)
    name.value = c?.name ?? ''
    icon.value = c?.icon ?? 'folder'
  },
)

function save() {
  const n = name.value.trim()
  if (!n) return ui.toast('请输入分类名称', 'error')
  if (ui.categoryEditor.id) app.updateCategory(ui.categoryEditor.id, { name: n, icon: icon.value })
  else app.setActiveCategory(app.addCategory(n, icon.value).id)
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
    <template #footer>
      <button class="gy-btn-ghost" @click="ui.categoryEditor.open = false">取消</button>
      <button class="gy-btn-primary" @click="save">保存</button>
    </template>
  </Modal>
</template>

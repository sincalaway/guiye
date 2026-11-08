<script setup lang="ts">
import Modal from './Modal.vue'
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
function done(v: boolean) {
  ui.confirmState.open = false
  ui.confirmState.resolve?.(v)
}
</script>

<template>
  <Modal :open="ui.confirmState.open" :title="ui.confirmState.title" width="400px" @close="done(false)">
    <p class="text-sm leading-relaxed whitespace-pre-line text-zinc-600 dark:text-zinc-300">{{ ui.confirmState.message }}</p>
    <template #footer>
      <button class="gy-btn-ghost" @click="done(false)">取消</button>
      <button class="gy-btn-primary" @click="done(true)">确定</button>
    </template>
  </Modal>
</template>

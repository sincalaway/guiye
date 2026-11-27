<script setup lang="ts">
import WebAppWindow from './WebAppWindow.vue'
import { useUiStore } from '@/stores/ui'

/** WebApp 窗口层；Dock 见 layout/DockBar.vue */
const ui = useUiStore()
</script>

<template>
  <WebAppWindow v-for="w in ui.windows" :key="w.id" :win="w" />
</template>

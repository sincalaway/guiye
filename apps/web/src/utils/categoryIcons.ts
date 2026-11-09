import {
  House, Briefcase, Gamepad2, Bookmark, Folder, Code2, Palette, ShoppingCart, Music, Film, BookOpen, GraduationCap,
  Newspaper, Bot, Wrench, Heart, Star, Coffee, Globe, Camera, Plane, Wallet, MessageCircle, Cloud, Sparkles, Flame, Layers, Users,
} from 'lucide-vue-next'
import type { Component } from 'vue'

/** 分类可选图标（按需引入，避免把整个 lucide 打进包） */
export const CATEGORY_ICONS: Record<string, Component> = {
  house: House, briefcase: Briefcase, 'gamepad-2': Gamepad2, bookmark: Bookmark, folder: Folder, code: Code2,
  palette: Palette, cart: ShoppingCart, music: Music, film: Film, book: BookOpen, study: GraduationCap,
  news: Newspaper, bot: Bot, wrench: Wrench, heart: Heart, star: Star, coffee: Coffee, globe: Globe,
  camera: Camera, plane: Plane, wallet: Wallet, chat: MessageCircle, cloud: Cloud, sparkles: Sparkles,
  flame: Flame, layers: Layers, users: Users,
}

export const categoryIcon = (name: string): Component => CATEGORY_ICONS[name] ?? Folder

/** 每个分类图标的默认颜色（彩色侧栏） */
const ICON_COLORS: Record<string, string> = {
  house: '#f97316', briefcase: '#3b82f6', 'gamepad-2': '#8b5cf6', bookmark: '#ef4444', folder: '#eab308', code: '#10b981',
  palette: '#ec4899', cart: '#f59e0b', music: '#e11d48', film: '#6366f1', book: '#0ea5e9', study: '#14b8a6',
  news: '#64748b', bot: '#06b6d4', wrench: '#78716c', heart: '#f43f5e', star: '#facc15', coffee: '#a16207', globe: '#22c55e',
  camera: '#a855f7', plane: '#0284c7', wallet: '#16a34a', chat: '#22c55e', cloud: '#38bdf8', sparkles: '#d946ef',
  flame: '#ef4444', layers: '#4f46e5', users: '#0891b2',
}

/** 可手动选择的分类颜色 */
export const CATEGORY_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b']

export const categoryColor = (c: { icon: string; color?: string }): string => c.color || ICON_COLORS[c.icon] || '#3b82f6'

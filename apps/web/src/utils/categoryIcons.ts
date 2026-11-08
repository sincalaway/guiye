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

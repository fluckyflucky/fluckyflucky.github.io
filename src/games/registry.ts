import type { Component } from 'vue'
import { fruits } from './match3/fruits'
import dragonSmall from './dragonMerge/images/dragon-0.jpg'
import dragonMedium from './dragonMerge/images/dragon-4.jpg'
import dragonLarge from './dragonMerge/images/dragon-8.jpg'
import frogSmall from './dragonMerge/images/frog-0.jpg'
import frogMedium from './dragonMerge/images/frog-4.jpg'
import frogLarge from './dragonMerge/images/frog-8.jpg'

export interface GameDefinition {
  id: string
  title: string
  description: string
  category: string
  coverText: string
  coverImages?: string[]
  accent?: string
  controls: string
  props?: Record<string, unknown>
  load: () => Promise<{ default: Component }>
}

// The lobby and player both read this list. Add a game here to give it a card and URL.
export const games: GameDefinition[] = [
  {
    id: '2048',
    title: '2048',
    description: '滑动数字，合出 2048。',
    category: '数字益智',
    coverText: '2048',
    controls: '方向键 / WASD · 手机滑动',
    load: () => import('./game2048/Game2048.vue'),
  },
  {
    id: 'match3',
    title: '消消乐',
    description: '交换水果，三连消除。每局 30 步。',
    category: '休闲消除',
    coverText: '消消乐',
    coverImages: [fruits[0].image, fruits[2].image, fruits[4].image],
    accent: '#bbd995',
    controls: '点击交换 / 滑动交换',
    load: () => import('./match3/GameMatch3.vue'),
  },
  {
    id: 'merge-dragon',
    title: '合成大奶龙（盗版）',
    description: '奶龙图版，相同的碰到一起就合成。',
    category: '下落合成',
    coverText: '奶龙',
    coverImages: [dragonSmall, dragonMedium, dragonLarge],
    accent: '#f2c773',
    controls: '点击投放 / 拖动瞄准',
    props: { variant: 'dragon' },
    load: () => import('./dragonMerge/GameDragonMerge.vue'),
  },
  {
    id: 'merge-frog',
    title: '合成大奶龙（正版）',
    description: '奶蛙图版，相同的碰到一起就合成。',
    category: '下落合成',
    coverText: '奶蛙',
    coverImages: [frogSmall, frogMedium, frogLarge],
    accent: '#e4cf92',
    controls: '点击投放 / 拖动瞄准',
    props: { variant: 'frog' },
    load: () => import('./dragonMerge/GameDragonMerge.vue'),
  },
]

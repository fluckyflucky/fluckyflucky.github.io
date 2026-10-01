import type { Component } from 'vue'
import screwsCover from './screws/cover.svg'
import paintMazeCover from './paintMaze/cover.svg'
import civilizationCover from './civilization/cover.svg'
import game2048Cover from './game2048/cover.svg'
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
  coverImage?: string
  accent?: string
  controls: string
  props?: Record<string, unknown>
  load: () => Promise<{ default: Component }>
}

// The lobby and player both read this list. Add a game here to give it a card and URL.
export const games: GameDefinition[] = [
  {
    id: 'poker',
    title: '德州扑克',
    description: '和机器人打一桌，带 27 奖金规则。',
    category: '棋牌',
    coverText: '♠ ♥',
    accent: '#75ab8f',
    controls: '点击操作 · 虚拟筹码',
    load: () => import('./poker/GamePoker.vue'),
  },
  {
    id: 'sudoku',
    title: '数独',
    description: '唯一解，可推理。轻松和标准两档。',
    category: '数字益智',
    coverText: '1 2 3',
    controls: '点击填数 / 数字键',
    load: () => import('./sudoku/GameSudoku.vue'),
  },
  {
    id: 'mines',
    title: '扫雷',
    description: '9×9 或 25×25。首点安全。',
    category: '逻辑推理',
    coverText: '⚑',
    controls: '点击开格 · 右键 / 按钮标旗',
    load: () => import('./mines/GameMines.vue'),
  },
  {
    id: 'screws',
    title: '拧螺丝',
    description: '挪开螺丝，拆掉木板。50 关，带高难叠板。',
    category: '拆卸解谜',
    coverText: '拧螺丝',
    coverImage: screwsCover,
    accent: '#c69056',
    controls: '点击螺丝，再点空孔',
    load: () => import('./screws/GameScrews.vue'),
  },
  {
    id: 'paint-maze',
    title: '涂色迷宫',
    description: '一滑到底，把迷宫里的路涂满。30 关。',
    category: '滑动解谜',
    coverText: '涂色迷宫',
    coverImage: paintMazeCover,
    accent: '#89c8a6',
    controls: '方向键 / WASD · 手机滑动',
    load: () => import('./paintMaze/GamePaintMaze.vue'),
  },
  {
    id: 'civilization',
    title: '文明 · 六角世界',
    description: '建城、研究、扩张。从开拓者到火星。',
    category: '回合策略',
    coverText: '文明',
    coverImage: civilizationCover,
    accent: '#9bba8a',
    controls: '点击操作 · 拖动地图',
    load: () => import('./civilization/CivilizationGame.vue'),
  },
  {
    id: '2048',
    title: '2048',
    description: '滑动数字，合出 2048。',
    category: '数字益智',
    coverText: '2048',
    coverImage: game2048Cover,
    accent: '#efbc83',
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

import { createRouter, createWebHashHistory, type RouteLocationNormalized } from 'vue-router'
import Home from '../pages/Home.vue'

const MarkdownPage = () => import('../pages/MarkdownPage.vue')
const ToolJsonFormatter = () => import('../pages/ToolJsonFormatter.vue')
const ToolBase64 = () => import('../pages/ToolBase64.vue')
const ToolTimestamp = () => import('../pages/ToolTimestamp.vue')
const ToolDownloadCalc = () => import('../pages/ToolDownloadCalc.vue')
const JMdictSearch = () => import('../pages/JMdictSearch.vue')

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/notes', name: 'notes', component: MarkdownPage, props: { category: 'notes', slug: 'notes' } },
  { path: '/notes/:slug', name: 'note', component: MarkdownPage, props: (route: RouteLocationNormalized) => ({ category: 'notes', slug: route.params.slug }) },
  { path: '/thoughts', name: 'thoughts', component: MarkdownPage, props: { category: 'thoughts', slug: 'thoughts' } },
  { path: '/thoughts/:slug', name: 'thought', component: MarkdownPage, props: (route: RouteLocationNormalized) => ({ category: 'thoughts', slug: route.params.slug }) },
  { path: '/images', name: 'images', component: MarkdownPage, props: { category: 'images', slug: 'images' } },
  { path: '/images/:slug', name: 'image', component: MarkdownPage, props: (route: RouteLocationNormalized) => ({ category: 'images', slug: route.params.slug }) },
  { path: '/tools', name: 'tools', component: MarkdownPage, props: { category: 'tools', slug: 'tools' } },
  { path: '/tools/json-formatter', name: 'tool-json', component: ToolJsonFormatter },
  { path: '/tools/base64', name: 'tool-base64', component: ToolBase64 },
  { path: '/tools/timestamp', name: 'tool-timestamp', component: ToolTimestamp },
  { path: '/tools/download-calc', name: 'tool-download-calc', component: ToolDownloadCalc },
  { path: '/tools/flights', name: 'tool-flights', component: () => import('../pages/ToolFlights.vue') },
  { path: '/tools/jr-map', name: 'tool-jr-map', component: () => import('../pages/ToolJrMap.vue') },
  { path: '/tools/tokyo-map', name: 'tool-tokyo-map', component: () => import('../pages/ToolTokyoMap.vue') },
  { path: '/tools/:slug', name: 'tool', component: MarkdownPage, props: (route: RouteLocationNormalized) => ({ category: 'tools', slug: route.params.slug }) },
  { path: '/jmdict', name: 'jmdict', component: JMdictSearch },
  { path: '/games', name: 'games', component: () => import('../pages/Games.vue') },
  { path: '/games/:id', name: 'game', component: () => import('../pages/GamePage.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: MarkdownPage, props: { category: '', slug: '404' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router

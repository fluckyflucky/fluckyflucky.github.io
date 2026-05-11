import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import Home from '../pages/Home.vue'
import MarkdownPage from '../pages/MarkdownPage.vue'
import ToolJsonFormatter from '../pages/ToolJsonFormatter.vue'
import ToolBase64 from '../pages/ToolBase64.vue'
import ToolTimestamp from '../pages/ToolTimestamp.vue'
import ToolDownloadCalc from '../pages/ToolDownloadCalc.vue'
import JMdictSearch from '../pages/JMdictSearch.vue'
import JMdictFlashcard from '../pages/JMdictFlashcard.vue'

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
  { path: '/tools/:slug', name: 'tool', component: MarkdownPage, props: (route: RouteLocationNormalized) => ({ category: 'tools', slug: route.params.slug }) },
  { path: '/jmdict', name: 'jmdict', component: JMdictSearch },
  { path: '/jmdict/flashcard', name: 'jmdict-flashcard', component: JMdictFlashcard },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: MarkdownPage, props: { category: '', slug: '404' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router

// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import LyricsFalling from './components/LyricsFalling.vue'
import { h } from 'vue'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'layout-top': () => h(LyricsFalling),
        })
    },
}
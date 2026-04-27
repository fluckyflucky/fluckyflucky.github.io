// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import LyricsFalling from './components/LyricsFalling.vue'
import SummerGlow from './components/SummerGlow.vue'
import WaterRipples from './components/WaterRipples.vue'
import IntroEntryLink from './components/IntroEntryLink.vue'
import { h } from 'vue'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('IntroEntryLink', IntroEntryLink)
    },
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'layout-top': () => [h(SummerGlow), h(WaterRipples), h(LyricsFalling)],
        })
    },
}

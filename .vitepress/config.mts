import {defineConfig} from 'vitepress'

export default defineConfig({
    title: "青い夏的世界",
    description: "旅行，绘画与摄影",
    srcDir: 'markdown',
    cleanUrls: true,
    head: [
        ['link', {rel: 'icon', type: 'image', href: '/logo.png'}]
    ],
    appearance: 'dark',
    themeConfig: {
        logo: '/logo.png',
        nav: [
            {text: '首页', link: '/index'},
            {text: '小笔记', link: '/notes/notes'},
            {text: '胡思乱想', link: '/thoughts/thoughts'},
            {text: '图库', link: '/images/images'}
        ],
        sidebar: {
            '/notes/': {
                text: '小笔记',
                items: [
                    {text: '[前端] 关于 Element 中的 prop 和 slot-scope ', link: '/notes/1'},
                    {text: '[设计] 关于接口和抽象类', link: '/notes/2'},
                    {text: '[后端] JSON 反序列化中 TypeReference 的使用', link: '/notes/3'},
                    {text: '[后端] Gin 框架分层：经典的洋葱模型', link: '/notes/4' }
                ]
            },
            '/random-thoughts/': {
                text: '胡思乱想',
                items: [
                    {text: '年度总结-2025', link: '/thoughts/2025-summary'},
                    {text: '永无止境的夏', link: '/thoughts/endless-summer'},
                ]
            },
            '/images/': {
                text: '图库',
                items: [
                    {text: '写在前面', link: '/images/images'},
                    {text: '照片', link: '/images/photos'},
                    {text: '第一次日本行', link: '/images/japan-1'},
                ]
            }
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/fluckyflucky'}
        ],
        outline: [2, 3],
    }
})
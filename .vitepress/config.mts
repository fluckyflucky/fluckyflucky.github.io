import {defineConfig} from 'vitepress'

export default defineConfig({
    title: "青い夏的世界",
    description: "風のない海辺を歩いた あの夏へ",
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
            {text: '夏日记忆', link: '/thoughts/thoughts'},
            {text: '图库', link: '/images/images'},
            {text: '工具箱', link: '/tools/tools'}
        ],
        sidebar: {
            '/notes/': {
                text: '小笔记',
                items: [
                    {text: '[前端] 关于 Element 中的 prop 和 slot-scope', link: '/notes/element-prop-slot-scope'},
                    {text: '[杂项] 关于接口和抽象类', link: '/notes/interface-vs-abstract'},
                    {text: '[后端] JSON 反序列化中 TypeReference 的使用', link: '/notes/jackson-type-reference'},
                    {text: '[后端] Gin 框架分层：经典的洋葱模型', link: '/notes/gin-layered-architecture'},
                    {text: '[杂项] Git 常用命令汇总', link: '/notes/git-common-commands'}
                ]
            },
            '/thoughts/': {
                text: '夏日记忆',
                items: [
                    {text: '夏の色は青', link: '/thoughts/natsu-no-iro-wa-ao'},
                    {text: '若是夏天呼唤我们', link: '/thoughts/summer-calls'},
                ]
            },
            '/images/': {
                text: '图库',
                items: [
                    {text: '写在前面', link: '/images/images'},
                    {text: '照片', link: '/images/photos'},
                    {text: '第一次日本行', link: '/images/japan-1'},
                ]
            },
            '/tools/': {
                text: '工具箱',
                items: [
                    {text: 'JSON 格式化', link: '/tools/json-formatter'},
                    {text: 'Base64 编解码', link: '/tools/base64'},
                    {text: '时间戳转换', link: '/tools/timestamp'},
                    {text: '下载速度计算', link: '/tools/download-calc'},
                ]
            }
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/fluckyflucky'}
        ],
        outline: [2, 3],
    }
})
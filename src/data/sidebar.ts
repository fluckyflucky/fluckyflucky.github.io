import { categories } from 'virtual:markdown-index'

export interface SidebarItem {
  text: string
  link: string
}

export interface SidebarGroup {
  text: string
  items: SidebarItem[]
}

// Manual overrides for categories that mix markdown pages with custom Vue pages
const manualOverrides: Record<string, SidebarGroup> = {
  '/tools': {
    text: '工具箱',
    items: [
      { text: 'JSON 格式化', link: '/tools/json-formatter' },
      { text: 'Base64 编解码', link: '/tools/base64' },
      { text: '时间戳转换', link: '/tools/timestamp' },
      { text: '下载速度计算', link: '/tools/download-calc' },
    ],
  },
}

// Auto-detected from markdown files, with manual overrides taking precedence
export const sidebar: Record<string, SidebarGroup> = {
  ...categories,
  ...manualOverrides,
}

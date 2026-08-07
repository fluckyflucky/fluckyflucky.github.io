declare module 'virtual:markdown-index' {
  interface ArticleItem {
    text: string
    link: string
    date: string
  }

  interface CategoryData {
    text: string
    items: ArticleItem[]
  }

  export const categories: Record<string, CategoryData>
}

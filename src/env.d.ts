/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }
  interface Database {
    run(sql: string, params?: any[]): Database
    exec(sql: string, params?: any[]): QueryExecResult[]
    prepare(sql: string): Statement
    close(): void
  }
  interface QueryExecResult {
    columns: string[]
    values: any[][]
  }
  interface Statement {
    bind(params?: any[]): boolean
    step(): boolean
    get(): any[]
    getAsObject(): Record<string, any>
    reset(): void
    free(): boolean
  }
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}

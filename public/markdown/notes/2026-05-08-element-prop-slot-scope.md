# [前端] 关于 Element 中 prop 和 slot-scope

最近在给老师做的 Vue 2 前端项目里，遇到这样一段表格代码：

```html
<el-table v-loading="loading" :data="playlistList" @selection-change="handleSelectionChange">
    <el-table-column label="播表描述" align="center" prop="description" width="200"/>
    <el-table-column label="播列表" align="center" width="400">
      <template slot-scope="scope">
          <div v-for="(source, index) in JSON.parse(scope.row.listJson || '[]')"
                       :key="index">
            <!-- 子模块 -->
          </div>
      </template>
    </el-table-column>
</el-table>
```

两列都来自 `playlistList`，但写法不同：第一列直接传了 `prop="description"`，第二列则在 `<template>` 上使用了 `slot-scope="scope"`。

这两种写法对应不同的渲染方式：

- **第一列（`prop`）**：用于常规字段展示。组件会直接按 `prop` 指定的字段名，从当前行对象中取出 `description` 的值，以纯文本形式渲染到单元格里。
- **第二列（`slot-scope`）**：用于自定义单元格内容。这里的 `listJson` 是 JSON 字符串，需要先解析再循环渲染成多个子元素，`prop` 无法满足需求。通过作用域插槽可以拿到当前行的数据对象 `scope.row`，再由模板自行决定如何解析和渲染。

## Vue 2 和 Vue 3 的语法差异

`slot-scope` 是 Vue 2 中作用域插槽的旧语法。因为这个项目基于 Vue 2 和 Element UI，所以沿用了 `slot-scope="scope"`。

如果换到基于 Vue 3 的 Element Plus，虽然它仍兼容旧写法，但官方推荐使用更简洁的 `v-slot` 并直接解构出 `row`：

```html
<el-table-column label="播列表" align="center" width="400">
    <template v-slot="{ row }">
        <div v-for="(source, index) in JSON.parse(row.listJson || '[]')"
             :key="index">
            <!-- 子模块 -->
        </div>
    </template>
</el-table-column>
```

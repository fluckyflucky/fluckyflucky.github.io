---
title: "[前端] 关于 Element 中 prop 和 slot-scope"
---

# \[前端] 关于 Element 中 prop 和 slot-scope

最近两天在给老师做的项目里，在写前端时遇到了这样的代码：
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
在这里可以发现，表格第一个列用的是 `prop` 属性；而第二个没有用到，取而代之的，是在子块里面使用的 `slot-scope` 属性。
同样是从表格数据动态加载，这两列却采用了完全不同的渲染机制。为什么第二个块要用 `slot-scope` 呢？

结合 **Element Plus 文档** 和 **Gemini** 搜索解释，我找到一个能说服自己的解释：

- 第一列：使用 `prop` 绑定，是标准数据展示。它采用的是 **静态数据绑定** 机制 ，组件 **内部渲染** ，适用于数据结构已知的情况。它直接查找给定行中的description字段，把值以纯文本形式显示在页面上。
- 第二列：使用 `slot-scope` 绑定，是动态数据展示。它采用的是 **作用域插槽** 机制，组件 **外部渲染** ，适用于数据结构未知的情况。slot-scope 绑定后将数据传递给子组件，让子组件自行决定如何处理数据，以便实现复杂嵌套的子结构。

---

值得一提的是，`slot-scope` 是 Vue 2 中作用域插槽的旧语法。 而 Element Plus 是基于Vue3的。在 Vue 3 中，官方推荐使用更清晰、统一的 v-slot 语法。

由于项目是由 Vue 2 构建，所以我在这里使用了 `slot-scope` 。

PS：虽然 Element Plus 兼容 `slot-scope` ，但在 Vue3 项目中，最好使用 `v-slot` 并解构赋值：
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
# 添加小游戏

小游戏入口是 `/#/games`，每款游戏的地址是 `/#/games/<id>`。

1. 在 `src/games/<游戏目录>/` 下新增一个 Vue 游戏组件，自己管理游戏状态和交互。
2. 在 `src/games/registry.ts` 的 `games` 数组里添加一项：

```ts
{
  id: 'your-game', // 唯一的 URL 标识；不要包含斜杠
  title: '游戏名称',
  description: '一两句玩法介绍。',
  category: '休闲益智',
  coverText: 'PLAY', // 游戏卡片封面上的文字
  controls: '点击 / 触屏',
  load: () => import('./your-game/YourGame.vue'),
}
```

列表卡片、游戏路由、页面标题和返回入口会自动接入，无需修改路由或导航。组件进入游戏页时才加载。

可选字段 `coverImages` 是封面图片数组，`accent` 设置封面的颜色，`props` 会传给游戏组件。奶龙和奶蛙版共用 `dragonMerge/GameDragonMerge.vue`，通过 `props.variant` 选择图片组，存档分别保存。

消消乐的规则在 `match3/logic.ts`，合成游戏的碰撞与合并在 `dragonMerge/physics.ts`。合成游戏使用 Matter.js，物理引擎在进入游戏时才加载。奶龙 / 奶蛙的本地素材及来源见 `dragonMerge/ASSETS.md`。

沿用 2048 的实现时，可以参考 `game2048/Game2048.vue` 的响应式布局、键盘与触屏操作、减少动画设置和浏览器存档。新游戏的存储键应使用独立前缀（例如 `aoinatsu:your-game:v1`），访问浏览器存储时处理异常；在组件卸载时清理定时器和事件监听。

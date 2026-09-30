# 涂色迷宫

入口：`/#/games/paint-maze`。10 关，方向键 / WASD、屏幕滑动或方向按钮操作。

- 每次滑到墙前才停，路过的格子染色；全部道路涂满就过关。
- 地图使用固定种子的迷宫生成，尺寸逐渐增大；验证所有可达停靠点都仍能抵达全部道路，避免走进不可完成的区域。
- 提示从当前位置搜索通向未染色道路的最短路线，标出第一步方向。
- localStorage 键：`aoinatsu:paint-maze:v1`，保存当前局面、解锁关卡和各关最佳步数。撤销历史只保留在本次页面会话中。

玩法参考：[AMAZE! 官方应用页面](https://play.google.com/store/apps/details?id=com.crazylabs.amaze.game)。

运行规则测试（Node 22.6+）：

```sh
node --experimental-strip-types scripts/test-puzzles.mjs
```

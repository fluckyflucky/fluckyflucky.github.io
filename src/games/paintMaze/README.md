# 涂色迷宫

入口：`/#/games/paint-maze`。10 关，方向键 / WASD、屏幕滑动或方向按钮操作。

- 每次滑到墙前才停，路过的格子染色；全部道路涂满就过关。
- 10 张固定地图位于 `levels.ts`，包含岔路、环路和错位挡墙，尺寸逐渐增大。每关至少 3 个真正可达的停靠选择点，不再使用单线生成器。
- 关卡测试除检查涂满外，还检查岔路数量、环路数量和滑动停靠图上的分支，避免把“可通关”误当成“有路线选择”。
- 提示从当前位置搜索通向未染色道路的最短路线，标出第一步方向。
- localStorage 键：`aoinatsu:paint-maze:v2`，保存当前局面、解锁关卡和各关最佳步数。旧存档保留解锁进度，新地图局面与最佳成绩重置；不会拿旧地图的涂色套到新地图上。

玩法参考：[AMAZE! 官方应用页面](https://play.google.com/store/apps/details?id=com.crazylabs.amaze.game)。

运行规则测试（Node 22.6+）：

```sh
node --experimental-strip-types scripts/test-puzzles.mjs
```

# 奶蛙连连看

6×8 棋盘，八种图案，各三对。相同图案之间用不超过三个直线段连接，路径不能穿过其他牌，可以走棋盘外一圈。牌不会自动下落。

计时从第一次选牌开始，暂停及后台不计时，不设倒计时。提示与重排不限次数。无可连对子时自动重排，保留已清空位置及剩余图案数量。重排沿合法移除顺序放入对子，盘面有一条完整解法，不依赖随机重试。

规则参考 [咪嘟游戏的连线规则](https://midu.zongyigame.com/facts/llk/link-rule-cheatsheet.html)。图片来源见 [素材表](../frogArt/ASSETS.md)。局面、用时只存浏览器 localStorage。

检查 `node --experimental-strip-types scripts/test-frog-games.mjs`。独立方向搜索验证连线路径，并完成 100 局清盘。

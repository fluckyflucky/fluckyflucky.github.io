# 文明 · 六角世界

纯前端单机版，入口 `#/games/civilization`。不包含原作程序或美术素材。

## 已实现

- 18 × 12 轴向六角地图、七种地形、河流、资源、部落村庄、探索迷雾。
- 三个文明、移动与近远程战斗、地形防御、驻守回血、晋升、城市占领。
- 建城、人口增长、住房、自动市民地块产出、生产、区域容量与邻接加成。
- 16 项科技、12 项市政、前置依赖、尤里卡 / 鼓舞、五种政体、六张政策。
- 建造者改良、奇观唯一性、贸易、简化外交 / 宗教 / 伟人 / 城邦、五种胜利。
- 自动本地存档、JSON 备份、导入校验、手机地图滚动与缩放。

## 边界

这是压缩规则的可玩原型，不是文明 6 完整复刻。科技树为代表性子集，数值与依赖有调整；城邦目前是使者奖励，没有独立地图实体。外交为和平 / 战争开关；宗教用城市归属表示，没有压力、神学战与信条。AI 为基础生产和移动策略，暂无海军、间谍、忠诚度、宜居度、灾害、道路、完整时代与领袖特色。

存档放在 `localStorage` 的 `aoinatsu:civilization:v1`，不上传服务器、不写 cookie。存档约几十 KB。清浏览器数据或换域名会失去本机进度，支持导出。后续增加多存档、大地图时可迁移 IndexedDB。

## 扩展

`data.ts` 管理研究、单位、建筑和政策；`engine.ts` 是无 DOM 的规则；`store.ts` 管存档；Vue 组件管理展示与输入。修改存档结构须升级版本，并加入迁移。

## 规则参考

- [文明 6 官方手册](https://cdn.akamai.steamstatic.com/steam/apps/289070/manuals/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf)
- [Civilopedia：区域及人口容量](https://www.civilopedia.net/en-US/rise-and-fall/concepts/cities_10/)
- [Civilization Wiki：战斗](https://civilization.fandom.com/wiki/Combat_%28Civ6%29)
- [Civilization Wiki：胜利条件](https://civilization.fandom.com/wiki/Victory_%28Civ6%29)

重点保留六角地图、双研究树、城市区域落地、人口限制和多胜利路线；未实现部分不冒充原作规则。

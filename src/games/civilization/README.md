# 文明 · 六角世界

入口 `#/games/civilization`。Vue + SVG 的纯前端回合制单机游戏，适合静态 GitHub Pages；没有服务端、账户或云存档，不使用原作程序和美术。

## 内容

- 华夏、罗马、埃及及各自能力；标准 / 紧凑地图，大陆 / 盘古大陆，三档难度、两档速度、可复现随机种子。
- 六角地形、河流、海岸、资源、迷雾、村庄、蛮族营地；绘制森林、山脉、城市、改良与单位。地图支持拖动、缩放、产出图层、缩略图、移动范围和建设位置预览。
- 城市人口、淡水住房、宜居度、市民工作地块、生产重点、文化扩张、购地、区域容量和邻接收益；五项生产队列可取消与调整顺序，投入单独保留。
- 77 项科技、61 项市政，成本、前置、时代、提升条件与百科《风云变幻》逐项核对；切换研究保留进度。百科中的完整解锁列表不代表全部内容已经实现，界面逐项标记可建设状态。
- 55 项单位、建筑、区域、奇观与项目；13 种政体槽位、43 张可用政策，未实现的政体效果单独标记。政策检查解锁、淘汰与专属政体；生产加成、邻接翻倍、住房、使者、维护费与贸易按目标结算。已有单位区分近战防御、远程和轰炸攻击力，成本与维护费读取百科事实值。
- 地形移动成本、道路、控制区、海军与登船、地形防御、驻守、休息回血、远程与攻城、城墙、城市远程攻击、晋升、升级和占领。攻击先选目标并预览，再确认。
- 建造者有限次数，资源改良、修复、砍伐；铁、马、煤、石油按回合入库，军事生产与升级消耗库存。
- 商人建立有期限的实际路线、铺路并提供收益，结束返回；外交支持代表团、友谊、宣战、和谈与停战保护期。两座城邦在地图上有城市、军队和使者奖励。
- 万神殿、宗教、城市信仰压力与自然传播、传教士、简化伟人。科学胜利需要系外行星远征到达50光年；文化胜利按来访/国内游客比较。标准500回合、快速330回合结算分数。
- 城市 / 部队总览、待办、回合提醒、消息记录与分数走势；桌面侧栏、手机纵向布局、展开游戏、44px 触控按钮、键盘焦点与弹窗焦点管理。
- 常用操作优先显示；完整政体列表折叠，手机政策、外交与胜利卡片两列排列。SVG说明按钮支持hover、聚焦或点击，手机不依赖hover；提示包含规则、条件和当前未实现的内容。

## 存档

`localStorage` 自动存档键为 `aoinatsu:civilization:v3`；手动快照键为 `aoinatsu:civilization:manual:v3`。每次操作后防抖保存，页面离开时再保存；读取 / 写入校验完整结构、项目 ID、数值和实体引用，浏览器存储失败会显示提示。

支持本地 JSON 导入与导出（导入上限 2 MB）。导入不会把文件上传到任何服务器。检测到损坏的自动存档时不自动覆盖；用户可导入有效备份或明确开始新局。

v1/v2 自动迁移，原始数据和旧手动快照不删除。研究ID保持兼容，新游客和远征字段以0初始化；旧版未记录分文明旅游或历史文化总量，不能准确重建。重新开始才能获得新增的分层地形。新规则会改变旧局节奏和胜利要求。

旧寡头政体、商人共和国的政策槽尝试按类别重新分配；无法保留全部卡时拒绝迁移，不会悄悄丢卡。调整现有v3自动存档时，原始内容另存于 `aoinatsu:civilization:v3:pre-politics`，手动快照仍保留。

清理站点数据、换浏览器 / 设备 / 域名会失去自动存档。重要进度请导出 JSON；GitHub Pages 部署不能提供跨设备同步。

## 代码与验证

- `catalog.ts`：研究、生产项目、政体、政策、资源与领袖配置。
- `politics.ts` / `politics-reference.ts`：政体与政策事实、官方补丁差异、解锁/淘汰/专属校验。
- `model.ts` / `hex.ts`：存档模型、六角坐标与随机数。
- `world.ts`：无 DOM 的规则、生产结算、AI、战斗、贸易、宗教和胜利判断。
- `saves.ts`：严格校验、本地存储、手动快照与 v1 迁移。
- `CivilizationGame.vue`：面板、开局、交互状态和保存反馈；`HexWorld.vue`、`ResearchTree.vue`、`CityPanel.vue`、`UnitPanel.vue` 为视图组件。
- `engine.ts` / `data.ts` 仅保留给旧版存档迁移校验，新游戏不运行旧引擎。

```sh
node scripts/test-civilization.mjs
node scripts/test-civilization-fidelity.mjs
pnpm build
node scripts/test-civilization-browser.mjs # 先在4181启动preview
pnpm civilization:audit
```

回归测试覆盖依赖图、地图、生产、移动、战斗、政策、贸易、信仰、存档和完整回合模拟；独立来源用例检查研究数据、尤里卡、区域邻接、胜利、远程数据及迁移。来源采集脚本只输出apply_patch补丁，不在运行时联网。

## 规则边界

当前仍未达到90%对齐，不能发布为复刻完成版。研究数据覆盖和真实规则覆盖分开验收；完整缺口见 `release-readiness.ts` 与 `REVIEW.md`。没有忠诚度、总督、间谍、灾害、完整外交交易 / 世界议会、宗主国、信条与神学战；伟人、著作与文化修正、战略资源维护、编队和领袖能力仍不完整。每格暂只容纳一个单位。未来研究树未按原作逐局随机，部分效果与提升尚未实现，不能用其他条件替代。

`pnpm civilization:release-check` 运行回归、构建和对齐审查。当前对齐审查应返回非零退出码，不能把测试通过当作复刻验收通过。该脚本不是Git钩子。10月1日用户明确要求先rebase并push阶段版本；这不改变90%对齐验收未通过的状态。

## 参考资料

- [文明 6 官方手册](https://cdn.akamai.steamstatic.com/steam/apps/289070/manuals/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf)
- [Civilopedia：区域与人口容量](https://www.civilopedia.net/en-US/rise-and-fall/concepts/cities_10/)
- [Civilopedia：控制区](https://www.civilopedia.net/en-US/gathering-storm/concepts/movement_3/)
- [Civilopedia：贸易路线](https://www.civilopedia.net/en-US/gathering-storm/concepts/trade_1/)
- [Civilopedia：政府与政策](https://www.civilopedia.net/en-US/gathering-storm/concepts/govt_2/)
- [官方2020年12月补丁：理性主义、宜居度与淘汰规则](https://support.civilization.com/hc/en-us/articles/37661096258323-Patch-Notes-December-17-2020)
- [官方2021年2月补丁：政体槽位调整](https://support.civilization.com/hc/en-us/articles/37660820843667-Patch-Notes-February-25-2021)
- [Civilopedia：宜居度](https://www.civilopedia.net/en-US/gathering-storm/concepts/cities_16/)
- [Civilization Wiki：战斗](https://civilization.fandom.com/wiki/Combat_%28Civ6%29)
- [Civilization Wiki：胜利条件](https://civilization.fandom.com/wiki/Victory_%28Civ6%29)

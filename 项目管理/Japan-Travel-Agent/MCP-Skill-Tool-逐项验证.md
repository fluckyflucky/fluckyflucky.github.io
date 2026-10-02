# Japan Travel Agent：MCP / Skill / Tool 逐项验证与接入评估

核验日期：2026-10-03（Asia/Shanghai；开始调研于 10 月 2 日）。范围：原清单全部 20 个项目。原始清单另存本目录，方便对照。

本报告的“可用”分三层：**仓库/说明可访问、源码或配置存在、真实请求成功**。它们不互相替代。本轮核验公开仓库、关键源码、依赖配置、公开 API 与远程 MCP；没有注册付费账户、配置用户密钥、安装这些 MCP、购买或预订。需要凭证的报价和交易均未实测，网页抓取项目也未做浏览器端到端跑测。

项目版本、注册表响应和公开请求记录见 [核验记录.json](./核验记录.json)。源码链接指向本轮读取的分支；后续接入应固定版本/提交。`pushed_at` 仅反映 GitHub 最近推送，不能证明线上可用、数据新鲜或维护质量。

## 1. 选型结论

原清单适合作为候选目录，但“非常适合直接接入/生产”的判断应改成带条件的结论：

- **日本交通 MVP**：Transit API / japan-transit-mcp 可以先做限量路线验证，本轮已有真实 API 成功响应；但非官方、来源混合、存在网页/PDF 提取数据，数据授权与质量仍需逐 feed 审查。不能视为有 SLA 的免费全国交通服务。
- **生产交通候选**：官方駅すぱあと优先进入有凭证评测；NAVITIME API 作为对照。开源 MCP 的代码许可与上游数据使用权分开处理。
- **POI 候选**：japan-travel-mcp 值得先测，主要是景点资料、实体和住宿目录，不能提供酒店实时空房/房价；首次数据下载约 685 MB，生成描述和估算行程要保留出处及置信度。
- **季节候选**：japan-seasons-mcp 的公开 JSON 和 MCP 握手成功，适合继续业务测试；花卉/祭典包含静态整理数据，不能统称实时。
- **实时机票候选**：HasData 或直接封装 SerpAPI 做小样本比较。它们是第三方 Google Flights 数据服务，不是 Google 官方航空报价 API。本轮没有有凭证报价。
- **低价灵感**：Aviasales 返回近期搜索缓存，且该封装报价按单成人经济舱；不能拿它给多人商务舱报总价。ITA Matrix 封装依赖逆向接口，定位复杂搜索实验。
- **OTA/交易暂缓**：KAYAK、Skyscanner、中国 OTA 封装先作研究参考；其中 Skyscanner 作者明确不建议商用/生产。Amadeus 和 LetsFG 单独验证合同、账号权限、售后及交易路径。

推荐顺序：先完成 POI → 地点消歧 → 日期明确的交通查询 → 带来源的行程；再引入一个机票搜索源；确认报价语义后再考虑多 OTA 对比与预订。

## 2. 验证总表

状态：**D** = 文档确认；**C** = 关键源码/配置确认；**H** = 远程 MCP 初始化成功；**R** = 真实公开 API 业务响应。H 不代表 tools/call 成功。所有项目仓库均可访问。

| 原编号 | 项目 | 本轮证据 | 接入条件 | 本项目建议 |
|---|---|---|---|---|
| 1.1 | ValLaboratory/ekispert-api-mcp-server-docs | D，官方服务文档 | API access key、合同额度 | 生产候选，待有凭证评测 |
| 1.2 | Anchovy-s3/japan-transit-mcp | C、R（底层 API） | 无 Key，Node ≥18 | 限量 MVP 候选 |
| 1.3 | tysonwu/norikae-mcp | C | Node ≥18、Yahoo 页面可访问 | 个人 PoC 候选 |
| 1.4 | loosephoto/tokyo-transit-mcp | D、配置确认 | 本地图路由；ODPT 功能需 Key | 东京信息补充，非全国时刻引擎 |
| 1.5 | kasuganosora/tokyo-transit.skill | C | Node ≥18、ODPT Key | Skill 设计参考、查询脚本 |
| 1.6 | GHagui/mcp-navitime-rust | C | Rust、`TOKEN_RAPIDAPI`、API 订阅 | 商业 API 接入参考 |
| 1.7 | TakeruF/japan-rail-mcp | C | Node ≥22，实时数据需 Ekispert Standard Key | Schema 参考、新干线专项候选 |
| 1.8 | youseiushida/japan-transfer-mcp | C、H、R（站点工具） | Jorudan 页面；本地 Node 或公开端点 | 备选 PoC，路线待测 |
| 2.1 | ookami0210/japan-travel-mcp | D | 本地下载数据、检索资源 | POI 优先候选，待数据抽检 |
| 2.2 | haomingkoo/japan-seasons-mcp | C、H、R（JSON/祭典工具） | 公共远程端点或本地 Node | 季节优先候选 |
| 3.1 | HasData/google-flights-mcp | C、服务文档 | HasData API Key / OAuth | 付费搜索优先评测 |
| 3.2 | salamentic/google-flights-mcp | C，发现说明/源码不符 | Python ≥3.11、fast-flights | 不按原 README 直接接入 |
| 3.3 | apappascs/mcp-flight-search | C，发现默认航司过滤 | Java 17+、SerpAPI Key | 参考实现，需修改默认条件 |
| 3.4 | Shuangbing/kayak-headless-mcp-server | C | Node、Playwright Chromium、会话 | 抓取实验，待稳定性/许可核验 |
| 3.5 | shadyvb/mcp-skyscanner | C | Python、逆向客户端 submodule | 排除生产选型 |
| 3.6 | jimmylang74/flight_search_mcp | C | Python ≥3.11、Chromium | 国内搜索实验，国际航线未证明 |
| 3.7 | YogevKr/itamx | C | Python ≥3.12、MCP extras | 复杂机票实验 |
| 3.8 | stufently/aviasales-mcp | C、官方 API 文档 | Python ≥3.12、Travelpayouts token | 缓存灵感搜索 |
| 3.9 | pgallar/amadeus-travelapi-mcp | C | Amadeus credentials、生产权限 | 重封装优于直接上线 |
| 3.10 | LetsFG/LetsFG | C、供应商文档 | 授权 token / Developer API | 交易尽调候选 |

## 3. 日本交通逐项核验

### 1.1 駅すぱあと API MCP Server

**结论：官方托管 MCP 确认存在；该仓库仅提供文档，服务端程序非公开。**

- 来源：[仓库 README](https://github.com/ValLaboratory/ekispert-api-mcp-server-docs)、[工具详情](https://github.com/ValLaboratory/ekispert-api-mcp-server-docs/blob/master/docs/features.md)。
- 连接：Streamable HTTP，`https://api-mcp.ekispert.jp/mcp`；Header `ekispert-api-access-key`，建议后端注入环境变量 `EKISPERT_API_ACCESS_KEY`。
- 文档列出 6 个工具：`ekispert_api_get_stations`、`ekispert_api_get_stations_from_address`、`ekispert_api_get_stations_from_geo`、`ekispert_api_search_routes`、`ekispert_api_generate_condition`、`ekispert_api_search_ranges`。
- 支持地址、坐标、站点与路线条件；站点查询默认 `simplify="true"` 不返回坐标，坐标需求应使用 `simplify="false"`。不能把“能搜站”当成“默认能拿经纬度”。
- 接入费用按普通 API 调用计数；README 提供 90 天评价版入口，并提示 2026 年后半可能调整认证/正式使用流程，接入前重新确认。
- **未验证**：有效 Key 的握手/业务调用、签约数据范围、速率与实际费用。不固定未经合同确认的价格。
- 首测：站名消歧、地址附近站、东京→新宿、跨城、新干线、到达/终电；核对 IC/现金票价和数据授权范围。

### 1.2 japan-transit-mcp

**结论：非官方 stdio 封装；底层公开 API 实测通，适合作为受控 MVP 候选。**

- 来源：[README](https://github.com/Anchovy-s3/japan-transit-mcp)、[工具实现](https://github.com/Anchovy-s3/japan-transit-mcp/blob/main/src/index.ts)、[上游 API](https://api.transit.ls8h.com/)、[条款入口](https://transit.ls8h.com/terms)。
- Node ≥18；源码构建后 `node dist/index.js`；底层默认 `https://api.transit.ls8h.com`，无凭证。公开接口仅 GET。
- 原清单 9 个工具确认，另有 `health`，合计 10 个。地点查询返回 `endpoint`；路线使用带 feed 前缀的 stop ID 或 `geo:lat,lon`。
- 实测：health 返回 `status:ok`；“東京駅”地点查询有结果；东京站附近→新宿附近的坐标路线返回步行及铁路候选；feeds 返回来源、license、更新时间等。一次 plan 请求约 19 秒，仅代表这一次，不是延迟指标。
- **重要发现**：地点候选中出现东京以外、description 为 `artwork` 的同名记录。不能直接取第一条，更不能只依赖 `kind:station`；应结合坐标、行政区、source 和 description 消歧。
- **来源纠正**：上游不只 GTFS/ODPT；实测有 `scrape-jreast-*` 路段及“官方 PDF 由来”来源。后者是来源描述，不能自动当成开放许可。MIT 仅覆盖 MCP 代码。
- 秒数以服务日零点计算，可超过 86400；未知票价缺失，不能补为 0。此轮请求发生在日本凌晨，返回步行/清晨列车合理，不能据此宣称日间路线质量通过。
- 下一步：指定 JST 工作日/周末 09:00，对比东京、京都、大阪、札幌、农村巴士；检查 departures 授权、终电跨日、数据过期及无路线响应。本地 MCP 启动未测。

### 1.3 norikae-mcp

**结论：工具及选项有源码对应；依赖 Yahoo! 乗換案内网页，仓库定位个人使用。**

- 来源：[README](https://github.com/tysonwu/norikae-mcp)、[入口](https://github.com/tysonwu/norikae-mcp/blob/main/src/index.ts)。
- Node ≥18，stdio；包名 `norikae-mcp`，配置示例 `npx -y norikae-mcp`。
- `search_route` 支持 from/to、最多 3 个 via、日期时分、出发/到达/始发/终电、IC/现金、席别、步行速度、排序和交通种类开关。
- 席别选项表示路线/票价条件，不代表余票或预订。实时延误不保证包含；无独立站点消歧 API。
- README 标示个人用途、要求检查 Yahoo 条款；未证明页面自动化商业使用获许可。本轮未抓取/运行。
- 首测：站名歧义、指定 JST 日期、终电、三经由站、DOM 变更和空结果；只给 PoC 优先级。

### 1.4 tokyo-transit-mcp

**结论：东京综合信息工具丰富；内置图路线与实时 ODPT 信息应分别评估。**

- 来源：[README](https://github.com/loosephoto/tokyo-transit-mcp)、[包配置](https://github.com/loosephoto/tokyo-transit-mcp/blob/main/package.json)。本轮包配置版本 2.57.0。
- Node/stdio，入口 `src/index.mjs`；npm 当前该名查询 404，应先从源码运行；README 声称内置图覆盖 126 线路、1,472 站，图路由免 Key；ODPT 实时/时刻/票价功能仍依赖所需凭证与数据覆盖。覆盖数字未独立复算。
- 文档列 13 个工具，包括 `search_route`、`get_station_info`、`get_weather`、`search_fare`、`get_timetable`、`search_bus`、`get_airport_access`、`list_transit_operators`、`get_operator_routes`、`list_ferry_ports`、`search_ferry`、`list_community_buses`、`get_running_status`。
- `search_route` 的文档输入重点是 from/to/language/user_location，没有全国路线服务那样完整的日期/到达/终电条件；不能据此承担未来某日的精确换乘时刻搜索。
- **票价边界**：只对 ODPT 提供相应数据的运营商查询票价，JR 与大量私铁及跨运营商通算不支持，可能返回 Yahoo fallback URL；不能统称完整东京票价。
- 天气/建议文本、GBFS、GTFS 和实时状态需分别标注来源；模拟 `-test` 输出不得混进真实结果。
- 本轮未启动运行；建议与 Transit / Ekispert 做同路线对照，定位东京实时补充，而非全国主 Provider。

### 1.5 tokyo-transit.skill

**结论：操作指南和两份 Node 脚本存在；不提供换乘规划。**

- 来源：[README](https://github.com/kasuganosora/tokyo-transit.skill)、[Skill 文件](https://github.com/kasuganosora/tokyo-transit.skill/blob/master/SKILL.md)、[通用查询脚本](https://github.com/kasuganosora/tokyo-transit.skill/blob/master/scripts/odpt_query.js)。本轮作为研究材料读取，未安装该 Skill。
- Node ≥18，`ODPT_API_KEY`；直接访问 `https://api.odpt.org/api/v4/`，鉴权参数 `acl:consumerKey`。仓库提及 `/data/secrets/odpt.env` 是作者环境约定，不代表我们已有密钥。
- `odpt_station.js` 站名检索；`odpt_query.js` 查询 ODPT 资源。可作站、线路、时刻和列车位置数据访问；README 声称关东 42 运营方，未逐运营方实测。
- 作者指南强调查询前过滤、无换乘能力时明确告知、403 不盲目重试；很适合借鉴到自有 Skill。
- “`limit` 参数返回空数组”和额度数字是作者环境经验，未在我们的有效 Key 下复验，不宜当成 ODPT 全局永久规则。
- 首测：东京 Metro 站/线路/时刻/位置；检查 API 真实资源类型及许可。航空信息不等于机票价格/余票。

### 1.6 mcp-navitime-rust

**结论：正规 API 的非官方 Rust 封装；当前 Tool 比上游 API 能力窄。**

- 来源：[README](https://github.com/GHagui/mcp-navitime-rust)、[MCP 实现](https://github.com/GHagui/mcp-navitime-rust/blob/main/src/adapters/inbound/mcp_server.rs)、[RapidAPI 服务](https://rapidapi.com/navitimejapan-navitimejapan/api/navitime-route-totalnavi)。
- `cargo build --release`；stdio/JSON-RPC，环境变量为 **`TOKEN_RAPIDAPI`**，须订阅相应 API；免费档声明未在供应商账单页面复核。
- 单 Tool `search_transit_route`：start_lat/start_lon/goal_lat/goal_lon，可选 start_time。站名须先转换坐标；未暴露完整到达/始发/终电/经由站参数。
- 领域层有结构化路线与票价模型，但 MCP 实际调用 `format_route_response` 输出文本，接入时最好改为规范 JSON，避免从文本反向解析。
- 声称支持 JR/私铁/巴士/飞机等，覆盖取决于上游套餐；本轮未编译或有 Key 请求。
- 首测：东京地铁、跨城巴士、机场、新干线、未知运价、401/429、JST 时间解释。

### 1.7 japan-rail-mcp

**结论：很好的铁路契约参考；v0.1 明确不支持换乘及余票。**

- 来源：[README](https://github.com/TakeruF/japan-rail-mcp)、[架构](https://github.com/TakeruF/japan-rail-mcp/blob/main/docs/architecture.md)、[数据源评估](https://github.com/TakeruF/japan-rail-mcp/blob/main/docs/data-sources.md)。
- Node ≥22，stdio；无 Key 只查内置 **58 站**目录。实时直达新干线需 `EKISPERT_API_KEY`，且协议包含 Standard Plan 路线端点。
- Tools：`get_provider_status`、`search_stations`、`search_trains`、`get_train_details`、`get_availability`、`compare_trains`、`search_journeys`。
- **原清单修正**：`search_journeys` 只是保留契约并返回 unsupported；`get_availability` 也返回 unsupported。`SeatAvailability` Schema 存在不能证明有座位库存。
- 可借鉴：数值 JPY、显式 +09:00、来源、canonical station ID、capability、structuredContent、只读注解。
- README 明确实时行为只有 fixture-backed 契约测试，没有真实账号验证。因此 Schema 优先级高于实际 Provider 优先级。
- 首测：Osaka/Shin-Osaka 消歧；无 Key 拒绝实时报价；有 Key 直达新干线；换乘/库存明确 unsupported。

### 1.8 japan-transfer-mcp

**结论：Jorudan 网页封装存在，远程 MCP 初始化、工具列表及站点业务调用成功；路线未测。**

- 来源：[README](https://github.com/youseiushida/japan-transfer-mcp)、[入口](https://github.com/youseiushida/japan-transfer-mcp/blob/main/src/index.ts)、[Jorudan 条款](https://www.jorudan.co.jp/terms/)。
- 本地 stdio：`npx japan-transfer-mcp`；README 提供 Cloudflare `/mcp`、`/sse` 公共演示端点。
- README 的 Tools 为 `search_station_by_name`、`search_route_by_name`；但线上 tools/list 的实际路线工具是 **`search_route_by_station_name`**，时间类型参数是 **`datetimeType`**，并非 README 的 `datetime_type`。站名要求日文、应取自站点检索。
- 底层 axios/cheerio 获取网页；README 的“实时交通”不能自动解读为列车实时位置或延误。
- 本轮 `/mcp` 初始化 HTTP 200，server version **0.0.6**；仓库 package 为 **0.0.7**，说明演示端点与源码不完全一致。
- 首次后续请求返回 403；按初始化、initialized 通知及响应会话处理，并统一请求头后，tools/list 与 `search_station_by_name(query="東京",onlyName=true)` 都返回 200、站点列表。不能单凭这次重试定位 403 原因。站点列表也含酒店/设施，不可全当铁路站。包配置 repository 指向 healthitJP，npm 当前版本又与仓库/演示不同，需核对发布来源。
- 建议作为备选 PoC；明确网页使用边界、来源声明和公共实例稳定性，不能把公开演示当生产 SLA。

## 4. 日本旅行与季节

### 2.1 japan-travel-mcp

**结论：数据集与 MCP 声明完整，适合 POI 检索；规模、冷启动及业务查询未独立跑测。**

- 来源：[README](https://github.com/ookami0210/japan-travel-mcp)、[Hugging Face 数据集](https://huggingface.co/datasets/open-travel/japan-travel-mcp-data)。
- 声称 13,394 景点、约 20,000 住宿、47 都道府县、18 语言；README 中也残留“17 supported languages”文字，应以真实数据语言列表抽检。
- `npx -y japan-travel-mcp`，首次下载约 **685 MB** 至 `~/.japan-travel-mcp/data/`，`JAPAN_TRAVEL_MCP_CACHE` 可改位置。免 API Key 不等于零存储/内存/冷启动成本。
- 当前 README 列 **19 Tools**，原清单还漏了 `get_multilingual`、`get_dmo`、`get_entities_bulk`。包含实体消歧、混合/语义检索、景点、住宿、地方食物和文化资料。
- `get_transport` 给坐标和官方 access URL，**不是实时换乘规划**；`get_hotels` 是目录，**没有价格/空房/预订**；`plan_feasibility_check` 是资料/距离/时间合理性检查，不应取代时刻路线和当天营业确认。
- 多语言描述由模型从资料生成，并非官方原文翻译；刷新目标约 30 天，重要祭典日期/闭馆仍要回官方来源。
- 代码 MIT，项目编纂数据声明 CC BY 4.0；OSM 派生字段保留 ODbL，不能一律重标 CC BY。
- 先抽测：京都清水寺、东京浅草寺、鸟取冷门地点、同名设施、酒店去重、中文实体、缺坐标；统计 source_url、更新时间、置信度。未下载全量数据。

### 2.2 japan-seasons-mcp

**结论：公开季节 JSON 与 MCP 初始化已实测成功；数据分实时、预测和静态整理三类。**

- 来源：[README](https://github.com/haomingkoo/japan-seasons-mcp)、[公开樱花 JSON](https://seasons.kooexperience.com/api/sakura/forecast)、[远程 MCP](https://seasons.kooexperience.com/mcp)。
- 远程 Streamable HTTP 或 `npx -y japan-seasons-mcp`；自托管可 `--http`。文档与 handshake 都为 0.5.0；文档称 17 Tools。
- 主要入口：`japan_seasonal_answer`、`sakura_now`、`koyo_now`；具体有 forecast/spots/best_dates、flowers_spots、festivals_list、fruit_seasons/fruit_farms、weather_forecast，另有 search/fetch。
- 本轮 JSON 返回 JMC 来源、区域/城市、forecast/observation/normal 日期及花季已结束状态；确认业务数据存在。10 月收到本年春季已结束数据不代表新一年度预测已发布。
- 樱花/红叶来自 JMC 数据，缓存约 1–6h；花卉/祭典有人工整理；天气通过 tsukumijima 转发 JMA，不能把全部数据写成气象厅实时官方接口。
- 模型花开进度可停在 100%，未必反映落花，应优先看近期 observation 和更新时间。
- 完整流程重试成功：tools/list 返回 **17 Tools**，`festivals_list(month=10)` 返回 **7 个事件**及官方链接。它使用通用月份/循环节庆文本，不能作为 2026 年具体举办日期的确认。商业使用与 JMC 数据再分发权仍需确认；MIT 只解释代码。
- 首测：10 月红叶、跨年樱花、明确旅游日期、静态祭典当年日期、天气预报可用时段；结果必须区分 observed/forecast/curated。

## 5. 机票、OTA 与交易逐项核验

### 3.1 HasData Google Flights MCP

**结论：供应商托管 MCP 与轻量 launcher 存在；报价未有凭证实测。**

- 来源：[README](https://github.com/HasData/google-flights-mcp)、[供应商 API 文档](https://docs.hasdata.com/apis/google-travel/flights)。
- Streamable HTTP：`https://mcp.hasdata.com/mcp?apis=google_travel_flights`，Header `x-api-key`；stdio launcher 可用 `HASDATA_API_KEY`。
- 核心是一个 Tool：`hasdata_google_travel_flights_getGoogleFlights`。单程/往返/multiCity、客舱、旅客、航司、转机、币种/地区等为供应商说明确认。
- **流程细化**：往返先取去程，再用 `departureToken` 取对应回程；`bookingToken` 再查销售选项。一次“往返搜索”不一定只有一个付费调用。
- 原始 MCP text 中还有 JSON 包装：解析 text 后取 `.json`，不要假定 content 本身就是航班数组。
- README 当前声明每月 1,000 免费 credits、每次成功调用 15 credits，约 66 次；只是当期供应商声明，计费/重试/后续腿查询需以账户确认。
- 最小首测：PVG→NRT 单程、PVG→HND 往返、TPE→KIX；对比人数/客舱/税费/行李/人民币和 OTA 页面。Booking options 只表示销售选项，不代表已锁价或完成出票。

### 3.2 salamentic/google-flights-mcp / fast-flights

**结论：原 README 与实际源码明显不一致，原清单的 Tool 名不能直接沿用。**

- 来源：[README](https://github.com/salamentic/google-flights-mcp)、[真实服务器文件](https://github.com/salamentic/google-flights-mcp/blob/main/src/flights-mcp-server.py)、[pyproject](https://github.com/salamentic/google-flights-mcp/blob/main/pyproject.toml)。
- README 说 `flight_planner_server.py` 和 `search_one_way_flights/search_round_trip_flights/create_travel_plan`；本轮源码入口是 **`src/flights-mcp-server.py`**，根 `main.py` 只打印 hello。
- 真正注册工具为 **`search_flights`、`airport_search`、`get_travel_dates`、`update_airports_database`**；plan_trip/compare_destinations 是 prompt，其他机场函数也不能自动算 Tool。
- pyproject 要求 Python ≥3.11（README 写 ≥3.10）；fast-flights ≥2.1、mcp；源码还引用 aiohttp，依赖应重新检查并固定版本。
- 输出是格式化字符串，不是本项目可直接比较的规范 JSON。机场库启动时依赖远程 CSV/本地缓存；查询可因机场库加载失败被拒。
- 本轮未运行或验证 fast-flights 当前抓取可用性；建议降级为代码参考，先修文档/入口/依赖，再测真实单程与往返价格语义。

### 3.3 mcp-flight-search / SerpAPI

**结论：MCP/SerpAPI 搜索实现存在，但默认筛选会遗漏多数中日航班。**

- 来源：[README](https://github.com/apappascs/mcp-flight-search)、[FlightSearchService](https://github.com/apappascs/mcp-flight-search/blob/main/backend/mcp-flight-server/src/main/java/com/lufthansa/mcp/flight/FlightSearchService.java)、[SerpAPI 官方参数](https://serpapi.com/google-flights-api)。
- Spring Boot/Java 17+，HTTP MCP `/mcp`；Key `SERP_GOOGLE_FLIGHTS_API_KEY`。完整演示还有 Next.js 和 Anthropic 客户端；只用 MCP 搜索服务不应强制带上整个 UI/聊天服务。
- 源码工具 `searchFlights`；机场检索目录按汉莎集团网络设计。
- **关键修正**：未指定 airlines 时默认 Lufthansa/SWISS/Austrian/Brussels/ITA/Eurowings/Discover，且默认地区德国、语言英语、币种 EUR。不能原样作为日本机票全市场搜索。
- 应去掉默认 include_airlines，改独立机场/城市解析与本地化；CNY/JPY、children/infants 等按最终契约映射，不从 UI 字段推断全部支持。
- 本轮未编译、有 Key 搜索或验证部署；仓库未识别标准 LICENSE，直接复用代码前确认授权。
- 若项目无需 Java，可直接用 SerpAPI 正式接口写自己的 FlightSearchProvider，再用 MCP 暴露。

### 3.4 kayak-headless-mcp-server

**结论：浏览器会话获取与轮询实现可研究，不是官方 KAYAK API。**

- 来源：[README](https://github.com/Shuangbing/kayak-headless-mcp-server)、[配置](https://github.com/Shuangbing/kayak-headless-mcp-server/blob/main/package.json)。
- Node/stdio；`npm install`、Playwright Chromium；工具 `search_flights`，使用本地 `.cache/` 按 host 存会话。
- 输入路线/日期/人数/直飞/sort/limit/site；压平 price/currency/provider/bookingUrl、往返腿时刻等。
- **原清单收窄**：KAYAK 结果可能出现 Trip.com 和航司，不能保证每条航线全部 OTA 都覆盖；bookingUrl 还可能只是跳转/会话链接，不证明可按展示价结算。
- 返回时刻示例没有时区偏移，应按机场当地时区转换。依赖 MCP v2 alpha，协议/版本兼容需单测。
- 本轮未运行 Chromium、拿 Cookie 或搜索；无标准 LICENSE 文件，代码商业复用权未确认。
- 首测：同一航线多日期/多站点、Cookie 过期、CAPTCHA、poll 超时、价币种、转机/往返、URL 可达与售罄；先列实验，不列主 Provider。

### 3.5 mcp-skyscanner

**结论：源码工具存在，但作者明确排除商业/生产使用，原清单建议过于积极。**

- 来源：[README](https://github.com/shadyvb/mcp-skyscanner)、[服务器](https://github.com/shadyvb/mcp-skyscanner/blob/main/mcp_server.py)、[项目配置](https://github.com/shadyvb/mcp-skyscanner/blob/main/pyproject.toml)。
- Python/FastMCP，`search_airports`、`search_flights`；依赖 reverse-engineered skyscanner-api Git submodule，clone 必须带 submodules。
- 单程/往返、客舱、adults 与 Best/Cheapest/Fastest/Direct 分桶由说明/实现确认；market/currency/locale 单独设置。
- README 写 educational only、not intended for commercial use，且可能违反 Skyscanner ToS。不能定位为长期 OTA 验价组件。
- pyproject 声明 GPL-3.0，GitHub 未识别标准许可；需同时核对第三方子模块许可、仓库声明和上游使用授权。
- 本轮未执行逆向请求。建议只看 Tool 形状；生产方案应另查 Skyscanner 正式合作 API 资格，原仓库不提供该资格。

### 3.6 飞猪 + 携程 flight_search_mcp

**结论：偏中国城市搜索，尚无证据证明可直接做中日国际航线比价。**

- 来源：[README](https://github.com/jimmylang74/flight_search_mcp)、[工具入口](https://github.com/jimmylang74/flight_search_mcp/blob/main/flight_search_server.py)、[城市映射](https://github.com/jimmylang74/flight_search_mcp/blob/main/flight_search/cities.py)。
- Python ≥3.11、Playwright Chromium；无状态 Streamable HTTP，默认 `0.0.0.0:8003/mcp`，环境变量 `FLIGHT_MCP_HOST/PORT`；公开部署须加认证和限制并发。
- `search_flights(出发城市,目的城市,日期)`，没有标准旅客结构/往返/客舱/行李参数。**默认仅飞猪启用，携程关闭**。
- 城市表以中国城市为主，**没有东京/大阪**；任意三字码能透传不等于 OTA 国际搜索页支持，携程弹层也依赖城市名。
- 输出顶层只有一个公共链接，非每条可购买 URL；仅携程时可指向移动首页。飞猪过滤中转和零价，不能说完整航班覆盖。
- 仓库声称单源约一分钟，多个源累加；实际耗时未测。滑块/登录墙是可能失败原因，“已处理”不能解读为永远通过。
- 首测必须是 PVG→NRT/HND、CAN→KIX，核对国际页面、人数、税费和币种；不通过前从日本 Agent 核心候选降级。无标准 LICENSE，复用授权待确认。

### 3.7 ITA Matrix MCP / itamx

**结论：复杂机票参数与 MCP 五工具存在；底层是逆向接口，不是官方开放航空 API。**

- 来源：[README](https://github.com/YogevKr/itamx)、[项目配置](https://github.com/YogevKr/itamx/blob/main/pyproject.toml)、[MCP 源码](https://github.com/YogevKr/itamx/blob/main/src/itamx/mcp/server.py)。
- Python ≥3.12；安装 MCP extras，入口 `itamx-mcp` / `itamx-mcp-http`，CLI/库可共用搜索逻辑。本轮 PyPI `itamx` 查询 404，先用源码安装，不把 uvx 当已验证路径。
- `search_flights`、`show_flight_details`、`search_dates`、`search_locations`、`search_airlines` 确认。多 Slice 支撑往返、多城、open jaw；routing language 表达指定航司/转机等。
- 后端访问 Google Alkali Matrix batch，README 说使用页面公开 key、目前不需 OAuth；该状态不构成官方许可或稳定承诺。
- CI 默认 fixtures；live smoke 需显式开启，未执行。复杂搜索是能力声明，不代表指定月全部日期已穷举/最低价保证。
- Matrix fare 不等于当前某 OTA 可出票总价；不提供自有出票。仓库还含其他航司奖励票模块，日本 MVP 不必带入。
- 建议：深度搜索实验；先测一程、往返、不同城市入出、5–7 天日期窗，再送授权报价源确认。

### 3.8 aviasales-mcp

**结论：缓存机票灵感工具边界比较明确，不能替代真实多人/客舱报价。**

- 来源：[README](https://github.com/stufently/aviasales-mcp)、[配置](https://github.com/stufently/aviasales-mcp/blob/main/pyproject.toml)、[Travelpayouts 官方说明](https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API)。
- Python ≥3.12，Key `AVIASALES_API_TOKEN`；默认 stdio，可通过 MCP_PORT 启用 HTTP 并配置 MCP_AUTH_TOKEN；代码 GPL-3.0-or-later。
- 13 个只读工具覆盖价格/日期/预算/附近机场及参考数据；原清单工具名基本一致。
- **价格语义**：数据由用户近期搜索缓存产生，不代表实时库存；报价是**单成人经济舱**。adults/children/infants/trip_class 主要写入 booking link，**不会把返回价变成相应人数/客舱总价**。
- 缓存按 market 区分，默认 ru；中国出发若缓存为空，不等于没有航班。expires_at、currency、price_note 必须保留。
- 原 README 说 PyPI 发布 pending，同时又给 uvx 示例；本轮 PyPI 查询 **404**，与 pending 提示一致，应使用源码/Docker；不能盲目复制 uvx 安装指令。
- 下一步：拿 token 测 PVG/TYO 与 CAN/OSA，比较不同 market；空结果、过期价、附近机场代码映射；预算搜索不承诺日期过滤。

### 3.9 Amadeus Travel API MCP

**结论：官方 API 的社区封装，包含写操作；现有实现不足以直接宣称生产预订就绪。**

- 来源：[README](https://github.com/pgallar/amadeus-travelapi-mcp)、[HTTP 客户端](https://github.com/pgallar/amadeus-travelapi-mcp/blob/main/src/travels/http_client.py)、[航班工具](https://github.com/pgallar/amadeus-travelapi-mcp/blob/main/src/travels/flights/routes.py)、[Amadeus 开发者入口](https://developers.amadeus.com/)。
- Docker/Python/FastMCP，当前默认 SSE `:8007/sse/`，不是原清单中其他服务的 Streamable HTTP；需客户端适配或迁移。
- `AMADEUS_CLIENT_ID/SECRET`；源码 **BASE_URL 固定 `https://api.amadeus.com` 生产域**，README 虽提测试/生产凭证，却没有对应环境选择，测试 Key 不能假定直接有效。
- 源码有 flight_offers_search_get/post、pricing、flight_create_orders、orders_get、seatmaps、availability 等；酒店/活动/transfer 也有独立模块。
- 认证模块可返回 token；生产暴露应去掉凭证读取工具、限制订单/取消类能力、保护旅客信息。token 缓存/刷新、timeout、401 重试等需要完善。
- API endpoint 存在不等于账号有订单/出票资格，也不等于航司全覆盖；生产访问、商业合作和售后须找供应商确认。官方 FAQ 链接本轮跳转首页，未据此断言具体航司缺口或出票条款。
- 未识别标准 LICENSE；未做凭证调用/订单。建议自有 adapter 先只读 search+pricing，测试环境通过后再单独设计交易。

### 3.10 LetsFG

**结论：MCP/SDK/CLI 及交易工具存在；供应商覆盖/费用/出票承诺未独立验证。**

- 来源：[仓库](https://github.com/LetsFG/LetsFG)、[MCP 专项说明](https://github.com/LetsFG/LetsFG/blob/main/sdk/mcp/README.md)、[MCP 实现](https://github.com/LetsFG/LetsFG/blob/main/sdk/mcp/src/index.ts)、[许可文件](https://github.com/LetsFG/LetsFG/blob/main/LICENSE)。
- 推荐托管 `https://letsfg.co/developers/api/mcp`，也有 `npx letsfg-mcp`、JS/Python SDK；本地 token `LETSFG_BEARER_TOKEN`，独立 Developer API 用 `LETSFG_API_KEY`。
- 原清单 flight/hotel 搜索与 booking 方向属实，但 README 的“所有航司/免费搜索/真实出票”是供应商声明，未验证日本航司或中国出发覆盖。
- **文档内部差异**：MCP 说明同时有“连接无需卡”的宣传文字与 card-backed token/卡绑定流程；说明称 2026-09-02 旧 Stripe token 撤销改 Revolut，LICENSE addendum 还写 Stripe Connect/1% 费用。不能按任一处旧文字写死当前成本和认证要求。
- 搜索授权可能与付款/预订权限同 token，应在自有服务按工具白名单拆分；本轮没有开户/卡绑定/报价/交易。
- 开源 connector 不证明上游来源全部正式签约。生产尽调应确认合同主体、日本覆盖、持票/出票、退款改签、付款授权、人工出票环节、数据跨境和收费。
- 可参考聚合/工具流程；放在交易候选层，不与 Amadeus 一起笼统标为“正规航空 API”。

## 6. 本轮真实请求与证据解释

公开请求为小样本，无账号、无支付。原始结果的摘要及请求地址保存在核验记录。

| 请求 | 结果 | 能证明什么 | 不能证明什么 |
|---|---|---|---|
| Transit `/api/health` | 200，status ok | 该时刻服务在线 | 路线准确率、SLA |
| Transit `places/suggest?q=東京駅` | 200，有候选 | 地点查询能返回数据 | 所有候选都是真实目标站 |
| Transit 坐标 `plan` | 200，有 journeys | 该时刻/该路线业务响应 | 全国覆盖、日间最优路线、正确票价 |
| Transit `feeds` | 200，来源与许可字段 | 可追踪来源，含网页/PDF 来源 | 所有数据都有商业再分发权 |
| Seasons `/api/sakura/forecast` | 200，有城市日期与状态 | 公共季节 JSON 有内容 | MCP 工具业务调用成功、新年度预测 |
| Seasons MCP initialize | 200，0.5.0 | 协议握手、服务身份 | 每个 Tool 都可调用 |
| Transfer MCP initialize | 200，0.0.6 | 演示远程 MCP 可握手 | Jorudan 搜索端到端成功 |
| Seasons tools/list + festivals_list(10月) | 200，17 工具/7 事件 | MCP 工具链及静态祭典检索成功 | 当年具体举办日期准确 |
| Transfer tools/list + station(東京) | 200，两工具/地点列表 | MCP 站点业务链成功，发现工具名差异 | 路线查询/票价/终电成功 |

一次 200 不代表正确业务结果；MCP 响应还需检查 JSON-RPC error、isError、结构完整性和来源。本轮首次进一步请求返回 403，随后按初始化/通知/会话处理流程重试，最终两服务均成功返回 tools/list 与各一次只读业务调用。初次错误仅描述本轮环境，不能归因为服务永久失效。

## 7. Provider 架构细化

建议保留原清单的统一 Tool 方向，但不能让 Agent 完全丢失数据来源。**调用入口稳定，结果必须带 Provider、时间、能力和数据依据。**

```text
Travel Agent / Skill（日期解析、消歧、选工具、失败处理）
  └─ Canonical Tools（固定输入/输出）
       ├─ POI Adapter → japan-travel / 官方资料
       ├─ Season Adapter → seasons JSON/MCP
       ├─ Transit Adapter → Transit / Ekispert / NAVITIME
       ├─ Realtime Adapter → ODPT / 东京补充工具
       ├─ Flight Discovery → Aviasales cache / Matrix experimental
       ├─ Flight Search → HasData / SerpAPI / Amadeus
       └─ Booking Service（独立权限、另行评估）
```

MCP 是协议和工具层；Skill 规定何时查询、怎么核验、怎么处理不足。先读 capability，再选支持该条件的 Provider，不能用没有到达/终电能力的服务悄悄近似回答。

### 统一查询约束

- 日期：把“明天”按用户出行意图解析；日本地面交通一律明确 Asia/Tokyo。中国出发航班起降各用机场所在地时区，不用一个固定时区解释整程。
- 地点：名称→多候选→坐标/行政区/正式 ID 消歧；东京/TYO 是城市代码，HND/NRT 是机场代码，不能混用。
- 金额：decimal 字符串或整数最小货币单位加 ISO currency；JPY 没有小数分，不能统一除 100。明确单人/全团、含税/不明、席别、行李和是否预估。
- 数据时间：`retrieved_at` 与 `source_updated_at` 分开。即使刚获取，源数据也可能是旧缓存。
- 来源：保留 `source_url`、feed/operator、license/attribution、observation/forecast/curated/cached/live_quote 类型；没有值就 unknown。
- 不支持：structured unsupported，而非伪造替代结果。HTTP 成功但 error/空结果/无能力分别处理。

建议结果最小结构：

```json
{
  "status": "ok",
  "provider": "provider-id",
  "retrieved_at": "2026-10-03T00:00:00+08:00",
  "source_updated_at": null,
  "data_kind": "cached",
  "capabilities": { "booking": false, "live_inventory": false },
  "price": {
    "amount_decimal": "1234",
    "currency": "CNY",
    "basis": "per_adult_economy",
    "tax_included": "unknown",
    "expires_at": null
  },
  "sources": [{ "url": "https://example.org/source", "license": "unknown" }],
  "warnings": ["示例结构，不是真实报价"],
  "data": []
}
```

价格候选和确认报价分阶段；未知价不填 0；搜不到缓存不说没有航线；总费用不可把单成人经济舱乘人数后冒充真实儿童/商务舱报价。

### 缓存、重试及运行建议

参考配置建议（不是供应商额度）：参考资料按版本/源更新时间缓存；实时状态短 TTL；路线按日期、时区、上下车 ID 与完整筛选条件缓存；航班 offer 严格按源 expires/token 生命周期。

API 后端保存 Key，浏览器只访问我们的后端。公共无 Key Transit 可技术上直连，但自有后端更便于限量、溯源、替换与统一错误。抓取实验单独 worker，长超时/低并发；403/CAPTCHA 直接作为该 Provider 不可用，不循环轰炸。429 按 Retry-After 退避。

搜索只读工具与订单/支付/取消分开；推荐输出可点击查询/销售链接，不能把 booking URL 的存在写成已预订。涉及订单时需要独立设计幂等、状态查询、失败补偿和明确用户确认。

## 8. 下一轮可执行验收清单

本轮完成资料核验和可公开访问的小样本请求。以下是**接入前待测工作**，不是已通过的检查，也不需要一次装满 20 个项目。

| 优先级 | 任务 | 测试输入 | 通过标准 |
|---|---|---|---|
| P0 | POI 冷启动/中文实体 | 清水寺/浅草寺/鸟取地点/同名设施 | 缓存可复用，ID/坐标/source 可追溯，歧义不强猜 |
| P0 | Transit 日间线路对照 | JST 工作日/周末 09:00；东京→新宿、京都→奈良、大阪→关西机场 | 时间/日期/换乘正确，官方对照，未知票价不为零 |
| P0 | 季节工具业务链 | 10 月红叶、翌年春季、当年祭典 | 已通祭典调用；继续测红叶/跨年预测，明确年份与观测 |
| P0 | 单一授权机票源 | PVG→NRT、PVG→HND 往返、CAN→KIX | 选完去回程，人数/舱等/币种/税费明确，链接可复核 |
| P1 | 官方交通对照 | 同一组路线使用 Ekispert / NAVITIME | Key/套餐/额度有效，差异解释可追溯 |
| P1 | Aviasales 灵感 | 月历/附近机场/market 切换 | 标明缓存、单成人经济舱，不伪装即时总价 |
| P1 | 中国 OTA 国际验证 | PVG→HND/NRT、CAN→KIX | 国际页面有航班与清楚税费；失败则排除核心层 |
| P2 | Matrix 复杂路线 | open jaw、5–7 天、东京转机 | 条件实际满足，候选交授权源重新确认 |
| P2 | 交易尽调 | Amadeus test 环境、LetsFG 合同/授权说明 | 权限、收费、出票与售后明确；不以源码 endpoint 代替资格 |

统一记录：Provider/版本、完整输入、HTTP/MCP 状态、返回数量、耗时、报价语义、source_updated_at、官方对照和差异原因。先积累几十条有代表性的案例，再决定主备组合；不能从一次成功请求推断生产可用。

## 9. 包发布与版本核验

以下是本轮注册表 GET 结果，未安装包。404 仅指该注册表/包名当时未找到，不代表仓库不存在。包发布者、制品源码及依赖安全未逐包审计，不能仅凭包名相同就视为与仓库一致。

| 注册表 | 包名 | 请求结果 | latest |
|---|---|---|---|
| npm | [`norikae-mcp`](https://registry.npmjs.org/norikae-mcp) | 200 | 0.1.4 |
| npm | [`japan-transit-mcp`](https://registry.npmjs.org/japan-transit-mcp) | HTTP Error 404: Not Found | — |
| npm | [`tokyo-transit-mcp`](https://registry.npmjs.org/tokyo-transit-mcp) | HTTP Error 404: Not Found | — |
| npm | [`japan-travel-mcp`](https://registry.npmjs.org/japan-travel-mcp) | 200 | 1.4.0 |
| npm | [`japan-seasons-mcp`](https://registry.npmjs.org/japan-seasons-mcp) | 200 | 0.5.0 |
| npm | [`japan-rail-mcp`](https://registry.npmjs.org/japan-rail-mcp) | HTTP Error 404: Not Found | — |
| npm | [`japan-transfer-mcp`](https://registry.npmjs.org/japan-transfer-mcp) | 200 | 0.0.11 |
| npm | [`@hasdata/google-flights-mcp`](https://registry.npmjs.org/@hasdata/google-flights-mcp) | 200 | 1.0.7 |
| npm | [`letsfg-mcp`](https://registry.npmjs.org/letsfg-mcp) | 200 | 2026.5.78 |
| pypi | [`aviasales-mcp`](https://pypi.org/pypi/aviasales-mcp/json) | HTTP Error 404: Not Found | — |
| pypi | [`itamx`](https://pypi.org/pypi/itamx/json) | HTTP Error 404: Not Found | — |
| pypi | [`fast-flights`](https://pypi.org/pypi/fast-flights/json) | 200 | 3.1.0 |

其中 norikae（源码 0.1.3 / npm 0.1.4）、transfer（源码 0.0.7 / 远程 0.0.6 / npm 0.0.11）、HasData（源码 1.0.1 / npm 1.0.7）存在版本差异；以实际 tools/list 和固定制品验证。japan-transit 与 japan-rail 采用源码构建路径，不把尚未找到的 npm 发布作为快捷接入承诺。

## 10. 仓库状态快照

本轮 20 个 GitHub 仓库均未标 archived。许可栏为 API 识别结果，空/NOASSERTION 不自动表示无许可证，需看逐项说明中的 LICENSE / manifest；它更不代表上游数据许可。日期为 GitHub UTC 推送时间。

| 仓库 | 分支 | pushed_at (UTC) | GitHub 识别许可 |
|---|---|---|---|
| [Anchovy-s3/japan-transit-mcp](https://github.com/Anchovy-s3/japan-transit-mcp) | main | 2026-06-29T13:23:39Z | MIT |
| [apappascs/mcp-flight-search](https://github.com/apappascs/mcp-flight-search) | main | 2025-11-27T15:29:08Z | 未识别 |
| [GHagui/mcp-navitime-rust](https://github.com/GHagui/mcp-navitime-rust) | main | 2026-03-23T23:38:34Z | MIT |
| [haomingkoo/japan-seasons-mcp](https://github.com/haomingkoo/japan-seasons-mcp) | main | 2026-08-28T09:44:27Z | MIT |
| [HasData/google-flights-mcp](https://github.com/HasData/google-flights-mcp) | main | 2026-09-24T14:15:19Z | MIT |
| [jimmylang74/flight_search_mcp](https://github.com/jimmylang74/flight_search_mcp) | main | 2026-08-11T11:01:37Z | 未识别 |
| [kasuganosora/tokyo-transit.skill](https://github.com/kasuganosora/tokyo-transit.skill) | master | 2026-09-27T10:50:54Z | MIT |
| [LetsFG/LetsFG](https://github.com/LetsFG/LetsFG) | main | 2026-10-02T14:36:44Z | NOASSERTION |
| [loosephoto/tokyo-transit-mcp](https://github.com/loosephoto/tokyo-transit-mcp) | main | 2026-09-21T07:45:48Z | MIT |
| [ookami0210/japan-travel-mcp](https://github.com/ookami0210/japan-travel-mcp) | main | 2026-10-02T14:03:43Z | NOASSERTION |
| [pgallar/amadeus-travelapi-mcp](https://github.com/pgallar/amadeus-travelapi-mcp) | main | 2025-08-08T15:18:34Z | 未识别 |
| [salamentic/google-flights-mcp](https://github.com/salamentic/google-flights-mcp) | main | 2025-03-05T23:42:36Z | 未识别 |
| [shadyvb/mcp-skyscanner](https://github.com/shadyvb/mcp-skyscanner) | main | 2025-11-30T15:02:14Z | 未识别 |
| [Shuangbing/kayak-headless-mcp-server](https://github.com/Shuangbing/kayak-headless-mcp-server) | main | 2026-05-18T07:28:59Z | 未识别 |
| [stufently/aviasales-mcp](https://github.com/stufently/aviasales-mcp) | main | 2026-08-21T13:52:47Z | GPL-3.0 |
| [TakeruF/japan-rail-mcp](https://github.com/TakeruF/japan-rail-mcp) | main | 2026-08-25T13:45:01Z | MIT |
| [tysonwu/norikae-mcp](https://github.com/tysonwu/norikae-mcp) | main | 2026-01-21T06:29:38Z | 未识别 |
| [ValLaboratory/ekispert-api-mcp-server-docs](https://github.com/ValLaboratory/ekispert-api-mcp-server-docs) | master | 2026-09-03T01:26:35Z | NOASSERTION |
| [YogevKr/itamx](https://github.com/YogevKr/itamx) | main | 2026-06-21T18:20:44Z | MIT |
| [youseiushida/japan-transfer-mcp](https://github.com/youseiushida/japan-transfer-mcp) | main | 2025-09-25T18:17:35Z | MIT |

## 11. 复测脚本

[复测公开接口.py](./复测公开接口.py) 与 [复测远程MCP.py](./复测远程MCP.py) 仅依赖 Python 标准库，复用了本轮执行过的请求逻辑，已做语法检查；交付路径版本未再次发请求。运行时会做少量公开只读请求并将新结果保存到脚本同目录，不覆盖本轮核验记录。不会调用订单/支付或读取本机秘密。

```bash
python3 项目管理/Japan-Travel-Agent/复测公开接口.py
python3 项目管理/Japan-Travel-Agent/复测远程MCP.py
```

公开 Transit 路线脚本沿用官方默认当前时间；做准确率验收请另行按 OpenAPI 指定日本当地服务日与查询时间。远程 MCP 脚本验证初始化、通知、工具列表，以及祭典/东京地点只读调用。

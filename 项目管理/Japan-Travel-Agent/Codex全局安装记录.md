# Codex 全局 MCP 安装记录

日期：2026-10-03。通过 `codex mcp add` 写入 `/Users/bdh/.codex/config.toml`，三个服务均 enabled。原配置备份在 `/Users/bdh/.codex/config.toml.before-japan-mcp-20261003`。

| 名称 | 安装/连接 | 实测 |
|---|---|---|
| japan-transit | 本地 Node stdio，`/Users/bdh/.codex/mcp-servers/japan-transit/dist/index.js` | 构建通过、SDK 初始化、10 个工具、东京站查询通过；前一轮底层路线 API 通过 |
| japan-seasons | 远程 `https://seasons.kooexperience.com/mcp` | SDK 初始化、17 个工具、10 月祭典 7 条通过 |
| japan-transfer | 远程 `https://japan-transfer-mcp-server.kawaii-cute.workers.dev/mcp` | Python 初始化、2 个工具、东京地点查询通过；Node SDK 当前网络连接超时，Codex 原生连接待新会话确认 |

全局配置已读取验证。当前聊天工具清单没有即时刷新，开新聊天检查加载状态；如未加载再重启应用。配置正确不等于 Codex 当前会话已经调用成功。

Jorudan 的 Python 与 Node 网络表现不同，原因尚未定位。线上路线工具名为 `search_route_by_station_name`，时间参数为 `datetimeType`，路线调用仍未实测。祭典检索是通用月份资料，当年具体举办日期应核对官方来源。

安装不含付费 Key、订单或支付服务；没有安装 685 MB POI 数据集。交通服务由已核验源码快照构建，依赖按 lockfile 安装。

检查和移除：

```bash
codex mcp get japan-transit
codex mcp get japan-seasons
codex mcp get japan-transfer
# 如需移除，对相应名字运行：codex mcp remove japan-transit
```

配置依据：[OpenAI 全局 MCP 配置说明](https://developers.openai.com/learn/docs-mcp)。实测记录：[SDK 请求结果](./Codex全局安装实测.json)、[Python 远程复测结果](./远程MCP复测结果.json)。

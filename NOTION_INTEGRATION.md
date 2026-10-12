# Notion 与 LLM 集成说明

此集成不改变番茄钟计时、完成判定、评价或 Dashboard 统计逻辑。

## 初始化

在时间轴的 `Notion` 模式填写 Token 和已共享给 Integration 的父页面，然后点击“检查并初始化工作区”。插件会按标题、字段别名和类型复用已有数据源，补充缺失字段，或创建以下 5 个数据库。旧版 Weekly Plan/Daily Plan 可原位升级。

## 默认数据库

### Phase Plan

| 字段 | 类型 |
|---|---|
| 阶段计划 | Title |
| 计划 ID | Rich text |
| 开始日期 / 结束日期 | Date |
| 计划描述 / 约束与说明 | Rich text |
| 每日里程碑 JSON | Rich text |
| 状态 | Select |

### Planning Profile

| 字段 | 类型 |
|---|---|
| 配置名称 | Title |
| Profile ID / 时区 | Rich text |
| 工作窗口摘要 / 固定安排摘要 / 习惯说明 | Rich text |
| 配置 JSON | Rich text |
| 更新时间 | Date |

### Daily Todo

| 字段 | 类型 |
|---|---|
| 待办 | Title |
| 待办 ID / 说明 / 来源 / 调整说明 | Rich text |
| 日期 | Date |
| 状态 / 优先级 / Origin | Select |
| 计划时间 | Date（start + end） |
| 预计番茄数 / 实际投入分钟 / 实际番茄数 | Number |

### Time Record

标题、记录 ID、时间、类型、持续时间、评价、备注、待办 ID、待办链接。它只接受本地真实记录的单向同步。

### Daily Review

标题、日期、用户完成情况、今日总结、时间分析、问题分析、次日关注点。用户完成情况是调用每日生成的强制前置条件。

## 同步边界

- 插件前端直接读写 Phase Plan、Planning Profile、Daily Todo 与 Daily Review。
- Time Record 只从本地单向新增/更新到 Notion；本地删除不自动删除 Notion 页面。
- 不同步正在运行或自动补全的“未记录时间”。
- Rich text ID 用于轻量查重和跨设备稳定识别，不使用 Relation/Rollup。
- 用户可在 Notion 修改待办，插件重新读取时会载入；主要编辑入口仍是插件前端。

## LLM 直连契约

所有请求使用 `version: 2`，并由 `action` 区分：

- `phase_plan.decompose`
- `daily_review.generate`
- `daily_todo.adjust`

插件直接调用 OpenAI-compatible Chat Completions API，在本地完成 action 路由、Prompt 选择、JSON 解析和结果清洗，然后由插件写入 Notion。Notion Token 不会发送给模型服务商。完整输入输出见 [LLM_PROMPTS_V1.md](./LLM_PROMPTS_V1.md)。

## 安全

- Notion Token 和 LLM API Key 不写入源码或导出文件。
- 两类密钥均保存在本机 `chrome.storage.local`，不会自动同步到其他设备。
- LLM 接口必须使用 HTTPS；共享电脑应使用独立浏览器用户配置。

完整安装与使用流程见 [PRODUCTIVITY_WORKFLOW_README.md](./PRODUCTIVITY_WORKFLOW_README.md)。

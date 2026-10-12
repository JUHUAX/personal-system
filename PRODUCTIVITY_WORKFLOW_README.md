# 极简番茄钟 × Notion × LLM：安装、配置与使用手册

当前版本采用“浏览器扩展直连 LLM”架构，不需要 Cloudflare Worker。

现有番茄钟计时、评价、离开机制、时间轴和 Dashboard 统计逻辑保持不变；Notion 与 LLM 功能只负责计划、存档、待办和每日总结。

## 1. 当前系统架构

```text
Chrome / Edge 扩展
  ├─ 本地计时、时间轴和统计
  ├─ 使用 Notion Token 直接读写 Notion
  └─ 使用 LLM API Key 直接调用 DeepSeek
                         ↓
              解析并校验结构化 JSON
                         ↓
                   写入 Notion
```

| 配置 | 作用 | 保存位置 |
|---|---|---|
| Notion Token | 允许插件访问指定 Notion 页面 | 当前浏览器的扩展本地存储 |
| LLM Endpoint | OpenAI-compatible Chat Completions 地址 | 当前浏览器的扩展本地存储 |
| 模型 ID | 指定调用的模型 | 当前浏览器的扩展本地存储 |
| LLM API Key | 授权模型调用和计费 | 当前浏览器的扩展本地存储 |

数据边界：

- Notion Token 只发送给 Notion API，不会发送给 DeepSeek。
- LLM API Key 只发送给用户填写的 HTTPS 模型接口，不会写入 Notion。
- 生成总结时，阶段计划、个人节奏、待办、用户完成情况和真实时间记录会发送给 LLM。
- Token 和 API Key 只保存在当前浏览器的扩展本地存储中；当前版本不提供整条时间轴的导入/导出，但可以将某一天的完整记录导出为 Markdown。
- `done` 只能由用户设置，LLM 和计时结果不会自动完成待办。

## 2. 为什么不再需要 Cloudflare Worker

插件目前直接承担此前 Worker 的全部职责：

1. 根据 action 选择对应 Prompt。
2. 调用 OpenAI-compatible Chat Completions API。
3. 要求模型返回 JSON。
4. 解析并清洗模型结果。
5. 限制待办数量和字段长度。
6. 阻止 LLM 把任务标记为完成。
7. 校验计划时间和冲突。
8. 把合法结果写入 Notion。

因此不需要：

- Cloudflare 账号；
- Node.js 或 Wrangler；
- Worker URL；
- Webhook Bearer Secret；
- `LLM_ENDPOINT`、`LLM_MODEL`、`LLM_API_KEY` 等 Worker 环境变量。

以前已经部署的 Worker 不影响插件，但当前版本不会再请求它，可以自行在 Cloudflare 中停用或删除。

## 3. 在 Windows 安装扩展

### Chrome

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `minimal_pomodoro_extension` 目录。

安装后点击扩展图标会直接进入主页面。顶部“番茄钟”用于开始和控制计时；需要覆盖在其他窗口上方时，点击番茄钟页面右上角的“打开置顶小窗”。“时间块”“时间流”“总结”“配置”分别负责时间轴、每日工作流、统计复盘与 Notion/LLM 设置。

### Edge

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择扩展目录。

代码更新后必须回到扩展管理页面点击“重新加载”，否则浏览器仍可能运行旧代码。

## 4. 创建 Notion Integration 和获取 Token

Notion Internal Integration 是当前工作区中的独立机器人账号。它只有在同时满足以下两个条件时才能访问内容：

1. Integration 拥有 Read、Insert、Update 能力。
2. 父页面明确共享给该 Integration。

Notion 官方说明见 [Internal connections](https://developers.notion.com/guides/get-started/internal-connections) 和 [Connection capabilities](https://developers.notion.com/reference/capabilities)。

### 4.1 创建 Internal Integration

1. 登录 Notion。
2. 打开 [Notion Integrations 管理页](https://www.notion.so/profile/integrations)。
3. 进入 Internal integrations / Internal connections。
4. 创建新的 Integration。
5. 选择保存番茄钟数据的工作区。
6. 名称可填写 `Minimal Pomodoro`。

创建 Internal Integration 通常需要 Workspace Owner 权限。

### 4.2 设置能力

至少开启：

- Read content；
- Insert content；
- Update content。

本系统不需要读取工作区成员信息。

### 4.3 复制 Notion Token

在 Integration 的 Configuration 页面找到 Installation access token / Internal Integration Secret，显示并复制完整字符串。

Token 可能以 `ntn_` 或 Notion 当前使用的其他前缀开头，插件不依赖前缀。

不要：

- 把 Token 写入源码或文档；
- 把 Token 发给 LLM；
- 在截图中暴露 Token；
- 把包含 Token 的浏览器配置交给他人。

Token 泄露后，应在 Notion 中刷新或轮换 Token，并更新每台电脑的插件配置。

### 4.4 创建并授权父页面

1. 在 Notion 新建普通空白页面，例如 `Minimal Pomodoro 工作区`。
2. 打开页面右上角 `•••` 菜单。
3. 选择 Connections / Add connections。
4. 搜索并添加 `Minimal Pomodoro` Integration。
5. 确认它可以访问该页面及其子页面。

也可以在 Integration 的 Content access 页面添加父页面。新建 Integration 默认没有页面访问权；只创建 Token 而不授权页面通常会得到 403 或 404。

### 4.5 获取父页面链接

在父页面菜单选择 Copy link。插件支持：

- 完整 Notion 页面链接；
- 带连字符的 Page ID；
- 32 位 Page ID。

建议直接粘贴完整父页面链接，不要使用某个数据库视图链接。

## 5. 初始化 Notion 工作区

1. 打开扩展时间轴。
2. 点击顶部 `Notion`。
3. 粘贴 Notion Token。
4. 粘贴已授权的父页面链接。
5. 点击“检查并初始化工作区”。

插件会检查、复用、升级或创建 6 个数据库：

| 数据库 | 用途 |
|---|---|
| Time Record | 已结束的真实时间记录 |
| Phase Plan | 任意天数的阶段计划和每日里程碑 |
| Planning Profile | 工作窗口、固定安排和习惯配置 |
| Daily Todo | 带计划时间的每日待办 |
| Daily Review | 用户完成情况和 LLM 日报 |
| Daily Archive | 按天汇总待办、时间流、完成情况和总结的完整文档 |

初始化完成后，6 个数据源 ID 会自动回填，一般不需要手工复制。已经使用旧版工作区的用户需再执行一次“检查并初始化工作区”，插件才会补建 Daily Archive；原有 5 个数据库和数据不会被删除。

旧版 Weekly Plan 或 Daily Plan 数据库若位于同一父页面且结构兼容，插件会复用并补充字段。内部兼容名称 `weeklyPlanSourceId` 不代表计划仍固定为 7 天。

### 测试 Notion 连接

点击“测试连接”会检查 Token、数据源权限和字段类型。该按钮只测试 Notion，不会消耗 LLM 额度。

## 6. 获取 DeepSeek API Key

1. 登录 [DeepSeek 开放平台](https://platform.deepseek.com/)。
2. 打开 API Keys 页面。
3. 创建新 API Key。
4. 立即复制并保存在安全位置。
5. 确认账户有可用余额或赠送额度。

DeepSeek API 按 Token 用量计费，价格可能调整，请查看 [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)。

当前默认配置：

```text
LLM 接口地址：https://api.deepseek.com/chat/completions
模型 ID：deepseek-v4-flash
```

当前 Chat Completions 和 JSON Output 说明见 [DeepSeek Create Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion)。若服务商更新模型 ID，只需修改插件前端配置，不需要修改源码。

API Key 泄露后，应在 DeepSeek 平台删除旧 Key、创建新 Key，并更新插件配置。

## 7. 在插件中配置 LLM 直连

打开时间轴的 `Notion` 模式，在“LLM 配置”填写：

| 字段 | DeepSeek 示例 |
|---|---|
| LLM 接口地址 | `https://api.deepseek.com/chat/completions` |
| 模型 ID | `deepseek-v4-flash` |
| LLM API Key | DeepSeek 平台生成的 API Key |

然后点击“保存设置”。

直连规则：

- Endpoint 必须使用 HTTPS。
- 插件使用 `Authorization: Bearer <API Key>` 请求模型接口。
- 请求采用 OpenAI-compatible `messages` 与 `response_format: {"type":"json_object"}`。
- API Key 保存在当前浏览器的 `chrome.storage.local`。
- API Key 不会自动同步到另一台电脑。

当前没有独立的“测试 LLM”按钮。最轻量的测试方法是点击“生成阶段计划”，在弹窗中创建一个短计划。成功返回每日里程碑即表示 Endpoint、模型 ID 和 API Key 可以正常工作。

## 8. 前端配置字段说明

### Notion 设置

| 字段 | 是否必需 | 说明 |
|---|---:|---|
| Notion Token | 是 | Installation access token |
| 工作区父页面 | 初始化时必需 | 已共享给 Integration 的普通页面 |
| Time Record 数据源 | 是 | 初始化后自动回填 |
| Phase Plan 数据源 | 是 | 初始化后自动回填 |
| Planning Profile 数据源 | 是 | 初始化后自动回填 |
| Daily Todo 数据源 | 是 | 初始化后自动回填 |
| Daily Review 数据源 | 是 | 初始化后自动回填 |

### LLM 和自动化设置

| 字段 | 是否必需 | 说明 |
|---|---:|---|
| LLM 接口地址 | 使用 LLM 时必需 | 必须为 HTTPS Chat Completions URL |
| 模型 ID | 使用 LLM 时必需 | 服务商实际支持的模型 ID |
| LLM API Key | 使用 LLM 时必需 | 只保存在本机扩展存储 |
| 日报触发时间 | 开启定时生成时必需 | 当前电脑本地时间 |
| 自动生成每日总结 | 可选 | 在日报触发时间生成总结和次日待办 |
| 自动调整日内待办 | 可选 | 独立开关；每天 13:00、18:00 调整尚未开始的待办 |
| 定时双向同步 | 可选 | 默认每 10 分钟批量写入本地待同步修改，同步真实时间记录并拉取 Notion 修改，间隔可在配置页调整 |

## 9. 第一次完整使用顺序

建议按以下顺序测试：

1. 重新加载扩展。
2. 填写 Notion Token 和父页面。
3. 初始化 Notion 工作区。
4. 点击“测试连接”，确认 6 个数据源可访问。
5. 填写 LLM Endpoint、模型 ID 和 API Key，保存设置。
6. 在“个人节奏”中填写至少一个工作窗口并保存。
7. 切换到“时间记录 → 阶段计划”，点击“新增阶段计划”，在弹窗中填写日期范围和自然语言目标后开始生成。
8. 确认每个自然日出现里程碑。
9. 在对应日期卡片中测试待办的新增、同步、编辑、完成和删除。
10. 输入自然语言调整方向，检查预览后再应用。
11. 在当天卡片填写“完成情况”并保存。
12. 在同一卡片点击“生成总结与次日待办”。
13. 检查 Daily Review、Daily Archive 和第二天的 Daily Todo。
14. 在当天卡片点击“导出 MD”，确认可以下载单日完整记录。
15. 从待办点击“开始番茄”，完成后同步时间记录。

没有配置个人节奏或阶段里程碑时，系统会按规则阻止日报生成，避免浪费模型额度或产生错误计划。

## 10. 阶段计划

阶段计划不固定为 7 天。主卡片不再常驻显示编辑表单；点击“生成阶段计划”后，在弹窗中填写：

- 开始日期；
- 结束日期；
- 自然语言目标；
- 可选的截止时间、强度和任务顺序约束。

“开始生成阶段计划”调用 `phase_plan.decompose`，为范围内每个自然日生成里程碑并写入 Notion。计划到期且没有覆盖下一天的新计划时，系统不会生成新待办，只提示创建新计划。

已有计划时，主卡片只显示 LLM 计划和“调整阶段计划”按钮。调整弹窗包含三种方式：

- **调整计划**：不改变结束日期，调用 LLM 重排剩余里程碑；说明可留空，留空时按真实进度和剩余容量自动调整。
- **延长时间**：选择晚于原结束日的新日期，调用 LLM 利用新增时间重排任务；说明同样可留空。
- **提前结束**：选择早于原结束日且不早于原开始日的日期，可以选择昨天或更早的过去日期。该操作直接截断计划范围、标记计划已结束并同步 Notion，不调用 LLM；说明可留空。

日期变化会同步写入 Phase Plan，新范围内的 Daily Todo、Daily Review 和 Daily Archive 会绑定该计划，移出范围的日期会解除绑定。

### 阶段计划总结

`phase_plan.summarize` 是独立于每日总结的 Prompt。插件会将阶段日期范围内的以下证据发送给 LLM：

- 原始目标、约束、每日里程碑和调整历史；
- 每日待办的 `done` / `in_progress` / `pending` 状态；
- 用户填写的完成情况和 LLM 日报；
- 真实时间记录；
- 插件确定性计算的每日总投入、工作投入、待办数量、完成数、完成率以及每项待办的实际投入。

计划正常执行时，只有在当前日期到达计划最后一天，并且用户正在查看该日卡片时，才显示“生成阶段计划总结”按钮。提前结束成功后，插件立即询问是否生成总结；选择“稍后再说”不会调用 LLM，之后查看该计划的最后一天仍可手动生成。生成结果会写入 Phase Plan 的“阶段总结”和“总结生成时间”字段。

LLM 首次拆分时会同时生成阶段计划名称，并将稳定的计划 ID 和名称写入阶段计划、每日待办和每日复盘。后续调整只修改当天及之后的剩余里程碑，保留阶段名称与计划 ID，避免破坏历史关联。阶段到期后，定时自动化会综合整个阶段的时间记录、待办完成情况和每日复盘生成阶段总结并写回 Phase Plan。

“今日”页顶部的阶段计划卡只直接显示当天里程碑，整个阶段的每日计划、原始描述、调整记录和阶段总结收入折叠区。多日“时间块”和“时间流”不再展示阶段计划。“时间记录 → 阶段计划”作为 Phase Plan 数据库管理页，卡片展示全部计划，并提供新增、详情、编辑和删除。编辑日期会联动更新日数据绑定；删除会先解除 Daily Todo、Daily Review 和 Daily Archive 的计划关联，再将 Phase Plan 页面移入 Notion 回收站。

## 11. 个人节奏

配置示例：

```text
工作窗口：1-5 09:00-12:00, 1-5 14:00-18:00
固定安排：1-5 12:00-14:00 午饭和午休, 1/3/5 18:30-19:30 锻炼
日期例外：2026-08-12 09:00-12:00 就医
```

- 星期使用 `0–6`，`0` 为周日，`1` 为周一。
- `1-5` 表示周一至周五。
- `1/3/5` 表示周一、周三、周五。
- 多个时间段可用中英文逗号或换行分隔。
- 排程估算时长只供 LLM 计算容量，不修改番茄钟计时设置。
- 每次点击“保存个人节奏”都会在 Notion 新增一条带时间戳的配置快照，不覆盖旧记录；插件始终读取“更新时间”最新的一条。旧快照用于回看和审计，不参与当前排程。

插件写入前会再次检查工作窗口、固定安排、日期例外及待办互相重叠，不只依赖 LLM 自检。

## 12. 每日待办与番茄执行

“时间流”按周一至周日显示七张并列日卡，每张卡从上到下固定为“待办、时间流、完成情况、当天总结”。插件中可以：

- 新建、编辑、删除和完成待办；
- 修改优先级、说明、预计番茄数和计划时间；
- 输入自然语言让 LLM 预览调整；
- 确认后应用调整到 Notion；
- 选择待办开始番茄。

LLM 调整只保护用户已标记为 `done` 的任务。用户手工创建、`pending`、`in_progress`、已经开始或原计划时间已过但尚未完成的任务，都可以在手动或 13:00/18:00 日内调整中重排。过时未完成任务必须重排到本次调整起点之后，或由模型明确返回 `deletedTodoIds` 删除；省略待办不会触发删除。

手动点击“LLM 生成待办”或“LLM 调整”时，弹窗可以选择是否为开始执行预留 10 分钟。勾选时，今天新生成或重新安排的任务最早从当前时间 10 分钟后开始；取消勾选时允许从当前时间开始。该选项只影响今天，未来日期仍按当天工作窗口排程，后台自动任务继续采用系统设定的准备边界。

阶段计划拆分和调整会为每天的每项规划任务给出预计专注分钟数，并保存每日合计。每日待办不会机械照搬阶段里程碑：系统会把阶段方向与估算作为参考，再根据前一天待办状态、用户完成情况和真实时间投入校正任务数量、粒度、顺序及预计番茄数。

开始待办时会带入标题、Notion 页面 ID、链接、日期和计划时间；真实 Time Record 仍按现有计时逻辑产生。

## 13. 每日晚间流程

1. 在“时间流”中找到当天卡片。
2. 填写自由文本“完成情况”。
3. 保存完成情况。
4. 点击“生成总结与次日待办”，或等待定时触发。
5. 插件直接调用 LLM。
6. 插件解析和校验结果。
7. 插件先把当日总结写入 Daily Review，再校验和写入次日待办，避免待办失败时丢失已生成的总结。
8. 次日有可用阶段计划、里程碑和工作窗口时，最多写入 8 条新待办；条件不足或时间校验失败时，仅跳过次日待办，当日总结仍保留。
9. 总结成功后，插件会把当日阶段计划、待办、真实时间流、完成情况、LLM 总结与分析合成一份文档，并写入 Daily Archive。

用户可以某天不写，系统不会擅自调用 LLM；之后想补生成时必须先补写该日完成情况。

### 完成情况的保存与旧记录

“保存完成情况”会先写入本地持久化待同步队列并立即更新界面，再由定时同步或用户手动同步写入 Daily Review。空文本也可以保存，作用是清空并覆盖 Notion 中原有内容；但在要求 LLM 生成当日总结时，完成情况仍必须是非空文本。如果旧版本曾在同一日期留下多条 Daily Review，清空时会同时清除这些同日旧记录的完成情况，避免刷新后旧文本再次出现。

### 每日归档与 Markdown 导出

- Daily Archive 每个日期只维护一份归档；重新生成总结或点击“更新每日归档”时会更新它，不会重复创建无限多页。
- 归档是对已有数据的确定性组装，不会额外调用 LLM，因此不增加模型费用。
- 当天总结生成后，时间流卡片会出现“在 Notion 中查看”的每日归档入口。
- 如果总结后又修改了待办、完成情况或时间记录，点击“更新每日归档”即可按当前最新数据重建页面内容。
- “导出 MD”会在本机下载 `minimal-pomodoro-YYYY-MM-DD.md`；只导出当天，不会读写其他文件，也不提供 PDF 导出。

## 14. 五个 LLM 动作

| action | 触发方式 | 结果 |
|---|---|---|
| `phase_plan.decompose` | 保存并拆分阶段计划 | 每日里程碑 |
| `daily_review.generate` | 每日结束 | 当天总结和次日待办 |
| `daily_todo.adjust` | 用户要求调整待办 | 调整预览 |
| `phase_plan.adjust` | 用户说明实际变化 | 重排剩余阶段里程碑 |
| `phase_plan.summarize` | 计划最后一天手动生成、提前结束后确认，或到期后定时补生成 | 阶段总结、按日时间分析、完成情况和后续建议 |

五类 Prompt、action 路由、JSON 解析和结果清洗均位于扩展本地代码中。完整契约见 [LLM_PROMPTS_V1.md](./LLM_PROMPTS_V1.md)。

## 15. 定时生成限制

定时生成由 Chrome/Edge 扩展后台闹钟触发，并不是独立云端任务：

- 电脑关机时不会运行。
- 浏览器完全关闭时不能保证运行。
- 扩展被禁用时不会运行。
- 触发前必须已经保存当天完成情况。
- 次日缺少阶段计划、里程碑或工作窗口时，当日总结仍会生成，但次日待办会跳过并显示原因。

错过触发时间后，可以在插件中手动生成。

## 16. 多设备使用

每台新电脑都需要：

1. 安装扩展。
2. 填写 Notion Token。
3. 填写同一个父页面并初始化/载入工作区。
4. 填写 LLM Endpoint、模型 ID 和 API Key。

可通过 Notion 共享：

- 阶段计划和每日里程碑；
- Planning Profile；
- Daily Todo；
- Daily Review；
- 已同步的 Time Record。

不会自动同步：

- `chrome.storage.local` 中的 Notion Token 和 LLM API Key；
- 尚未同步到 Notion 的本地时间记录；
- 本地 Dashboard 的完整原始统计状态。

待办、完成情况和个人节奏的手工修改会先进入当前设备的持久化待同步队列。它们会立即显示在本机，但只有在定时同步完成或用户点击顶部“待同步”后，其他设备才能从 Notion 读到。关闭“定时双向同步”时，队列不会丢失，但需手动点击顶部按钮写入。

多设备同时计时可能产生不同 ID 的重复记录，建议一个时段主要使用一台设备。

## 17. 常见错误与排查

### Notion 401：Token 无效

- 检查是否遗漏字符或复制了多余空格。
- 确认 Token 来自正确工作区。
- Token 轮换后必须在插件中更新。

### Notion 403：没有权限

- 检查 Integration 是否开启 Read、Insert、Update。
- 检查父页面是否添加该 Connection。
- 确认页面和 Integration 属于同一工作区。

### Notion 404：找不到页面或数据源

Notion 有时会把未授权资源表现为 404。重新共享父页面或数据库后，再初始化或测试连接。

### 提示 LLM 配置不完整

检查：

- Endpoint 是否填写完整；
- 模型 ID 是否存在；
- API Key 是否填写并保存。

### LLM HTTP 401 或 403

- API Key 无效、被删除或没有权限。
- 删除旧 Key、创建新 Key后更新插件配置。

### LLM HTTP 402 或额度错误

检查 DeepSeek 账户余额、赠送额度和计费状态。

### LLM HTTP 404

- Endpoint 路径错误；
- 模型 ID 已下线或拼写错误。

DeepSeek 默认 Endpoint 应包含 `/chat/completions`。

### 浏览器提示网络请求失败

- 检查 Endpoint 是否使用 HTTPS。
- 检查本机能否访问模型服务商。
- 检查代理、防火墙或 DNS。
- 确认扩展已重新加载到最新版本。

### LLM 请求超时

LLM 单次请求超时为 60 秒，Notion 单次请求超时为 30 秒。日内自动调整会分别显示“读取 Notion”、“LLM 首次生成”、“LLM 自动修正”和“写入第 N/总数条待办”。只有某个阶段长时间没有心跳时才会判定后台任务中断，不再因整个流程超过固定 3 分钟而误报。

### LLM 没有返回合法 JSON

- 当前模型可能不支持 `response_format: json_object`；
- 模型返回内容被截断；
- Endpoint 并非兼容 Chat Completions。

优先使用当前 DeepSeek 官方 Endpoint 和支持 JSON Output 的模型。

### 提示必须填写完成情况

这是产品规则，不是连接故障。先保存当天自由文本完成情况。

### 提示阶段计划或里程碑不存在

- 次日必须在某个阶段计划范围内。
- 阶段计划必须完成 LLM 拆分。
- 超过范围时创建新阶段计划。

### 提示没有工作窗口或时间冲突

- 为目标星期设置工作窗口。
- 检查固定安排和日期例外。
- 调整待办计划时间，避免重叠。

### 定时日报没有执行

- 确认已开启定时生成。
- 确认浏览器和扩展仍在运行。
- 确认触发前已保存完成情况。
- 确认 LLM 配置完整。
- 检查次日阶段计划、里程碑和工作窗口。

## 18. 费用说明

- Notion Token 本身只是访问凭证，不是单独收费商品；Notion 套餐和 API 限制以其当前政策为准。
- DeepSeek API 按 Token 用量计费，阶段拆分、每日生成和待办调整都会产生调用费用。
- 当前架构不再产生 Cloudflare Worker 费用。
- 普通 Notion 读写和本地番茄计时不会调用 LLM。

## 19. 安全建议

- [ ] Notion Token 只填在插件，不发送给任何 LLM。
- [ ] LLM Endpoint 只使用可信服务商的 HTTPS 地址。
- [ ] 不把 Notion Token 或 LLM API Key 写入源码、文档或截图。
- [ ] 不把浏览器用户配置目录分享给他人。
- [ ] 共享电脑使用独立浏览器用户配置。
- [ ] API Key 泄露后立即在服务商后台撤销并轮换。
- [ ] 定期检查 DeepSeek 用量，及时发现异常调用。

## 20. 仍未最终确定的产品项

1. 计划时间是否增加到真实时间轴的独立日程层；当前只在待办卡片显示。
2. 用户删除 LLM 待办后，是否持久保存 dismissed ID。
3. 容量不足的 deferred todo 是否写入 Notion；当前只返回提示。
4. 修改时区后，已生成待办是否自动换算；当前不自动换算。
5. Prompt 仍是第一版，需要结合真实样本评估。

数据库字段说明见 [NOTION_INTEGRATION.md](./NOTION_INTEGRATION.md)，Prompt 与 JSON 契约见 [LLM_PROMPTS_V1.md](./LLM_PROMPTS_V1.md)。

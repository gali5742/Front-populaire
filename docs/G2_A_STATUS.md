# G2-A · 工具链及基础契约
状态：STARTED / REMOTE BUILD PASS / BROWSER RETEST PENDING；2026-11-27。D87授权G2-A。本阶段为工程试验，不是可玩游戏。

## 远程实测（2026-11-27）
[运行#3](https://github.com/gali5742/Front-populaire/actions/runs/45956121730)，提交9475907e97dda69cba62981d3497220766e0652b，job 140362874922：Node v24.22.3，Ubuntu runner，依赖安装、锁文件归档、TypeScript类型检查、验收登记及8个原始blob核对、F1 v0.2配置校验、AST边界自测10/10（6个源文件、0违规）、Vitest 4个测试文件11项全部通过、标准与离线构建、Chromium安装通过。Chromium headless shell 159.0.8154.6。332项机制验收仍全部NOT_RUN。
[运行#1](https://github.com/gali5742/Front-populaire/actions/runs/45955579460)、[运行#2](https://github.com/gali5742/Front-populaire/actions/runs/45955950724)、运行#3均在同一E2E断言失败：getByRole('status')同时匹配隐含status角色的output计数器及显式role=status的导入反馈，Playwright strict mode violation；实际日志显示导入失败反馈正确出现，计数为1。前序file://离线打开、按钮交互、导出、刷新与有效导入断言通过，最后的错误导入状态保留与网络/页面错误断言未完整执行。修复：导入反馈添加独立可访问名称“存档操作反馈”，测试按角色及确切名称定位，补测刷新计数归零与成功导入反馈；原错误、状态保留、网络与页面错误断言均保留。修复提交须重新运行CI，未提前判PASS。
真实锁文件artifact ID 15179056354（运行#3），已下载并核查JSON（lockfileVersion 3、105个packages条目），尚未写入main；原文件SHA256 520e94729de7d861e03bd01ea4f39fdc19d83c36533220bc4f17b29388a3c7a1。后续必须提交真实锁文件并以npm ci复验，禁止手工编造。当前本地Node22/npm registry解析失败不再阻断远程安装；不意味着本地已验证。
此前独立JS检查（11项、F1 20项、边界策略14项）、Python随机向量5/5及原始blob核对保留。F1 v0.2基准修复f1-issue及主体引用；v0.1七个测试意图与金额不变。真实政治引擎、存档契约、情境执行未实施。

## 验收状态
| 项目 | 状态 |
|---|---|
| G1 v0.2技术方向 | D87确认 |
| Node24、npm install | 远程PASS |
| 真实锁文件 | 已归档并取得，待提交及npm ci复验 |
| TypeScript、双构建 | 远程PASS（运行#3） |
| Vitest | 11/11 PASS（运行#3） |
| 332项原断言及8个原始blob | 远程PASS，非机制测试 |
| F1 v0.2加载与静态依赖 | 远程PASS，AST自测10/10、0违规 |
| Chromium离线E2E | 原测试FAIL（定位器歧义）；修复待复验 |
| 真实Chrome/Edge及Firefox兼容、字体 | 未验收；Linux Chromium headless不是全部平台 |
| G2-A阶段验收 | 尚未通过 |
| G2-B | 未启动 |

G2-A关闭前须确认锁文件已入库且npm ci成功、修复后的E2E完整PASS、记录实际浏览器范围；不得把试验页当作可玩游戏。

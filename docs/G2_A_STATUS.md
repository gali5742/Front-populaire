# G2-A · 工具链及基础契约
状态：BASELINE ENGINEERING PASS / PLATFORM COVERAGE LIMITED；2026-11-27。D87授权G2-A。工程试验，不是可玩游戏。

## 远程实测
[运行#3](https://github.com/gali5742/Front-populaire/actions/runs/45956121730)，提交9475907e97dda69cba62981d3497220766e0652b，job 140362874922：Node v24.22.3，Ubuntu runner，依赖安装、锁文件归档、TypeScript类型检查、验收登记及8个原始blob核对、F1 v0.2配置校验、AST边界自测10/10（6个源文件、0违规）、Vitest 4个测试文件11项全部通过、标准与离线构建、Chromium安装通过。Chromium headless shell 159.0.8154.6。332项机制验收仍全部NOT_RUN。
[运行#1](https://github.com/gali5742/Front-populaire/actions/runs/45955579460)、[运行#2](https://github.com/gali5742/Front-populaire/actions/runs/45955950724)、运行#3均在同一E2E断言失败：getByRole('status')同时匹配隐含status角色的output计数器及显式role=status的导入反馈，Playwright strict mode violation；实际日志显示导入失败反馈正确出现，计数为1。修复：存档操作反馈独立可访问名称；原测试断言保留，补测刷新归零及成功导入反馈。
[运行#4](https://github.com/gali5742/Front-populaire/actions/runs/45956854837)，提交52fca3fe4541367877ba4426e6bb980f76f6b69f，job 140365217177：全部步骤PASS，4个Vitest文件11/11、Playwright离线E2E 1/1（断网file://、交互、导出、刷新、成功导入、损坏导入保留旧状态、无外网请求与页面错误）。实际下载HTML artifact 15178972778：224097字节，SHA256 c790c9881e2ea9be63ac4fc608a975334299f1ec7c7fab7f6ff854986b71b6ba；HTML解析确认一个经典script标签、无外部HTML资源引用，zh-CN和四项系统宋体回退声明存在。不同OS字体呈现尚未确认。
[运行#5](https://github.com/gali5742/Front-populaire/actions/runs/45957157046)，提交67d20f07262700bb1408fb3f62d946aef82eb128，job 140366185955：全部步骤PASS；一次性只读锁文件恢复步骤验证SHA256并导出已审阅字节，未扩大CI权限。运行#3/#4实际下载锁文件字节一致，53,909字节，lockfileVersion 3，105个packages条目，依赖resolved来源仅registry.npmjs.org。锁文件SHA256 520e94729de7d861e03bd01ea4f39fdc19d83c36533220bc4f17b29388a3c7a1，Git blob d6ccfbee517029f59671d2b387b0505b4334bf04。此次提交将该实际生成文件原样入库，移除一次性恢复步骤及npm install回退，CI改为npm ci；锁定版本随后完整复验通过，见运行#6。
[运行#6](https://github.com/gali5742/Front-populaire/actions/runs/45957429370)，提交ecb403bdb9d6b045b32918a13fc2ee98ae18c742，job 140367040120：Node24.22.3，npm ci、TypeScript、原始8份blob/332条对账、F1加载、AST自测10/10及6源文件零违规、Vitest 11/11、双构建、离线Chromium E2E 1/1、试验产物归档全部PASS。锁定依赖根声明与package.json一致；CI使用npm ci且不再有临时恢复步骤。G2-A基础工程门在已测试Linux Chromium环境通过，Windows实际Chrome/Edge、Firefox及字体视觉兼容未验收，后续G2-B/G2-E/G6继续验证，不宣称全平台通过。
此前独立JS检查（11项、F1 20项、边界策略14项）、Python随机向量5/5及原始blob核对保留。F1 v0.2基准修复f1-issue及主体引用；v0.1七个测试意图与金额不变。真实政治引擎、存档契约、情境执行未实施。本地Node22及npm registry网络阻断仍存在，但远程已可执行。

## 验收状态
| 项目 | 状态 |
|---|---|
| G1 v0.2技术方向 | D87确认 |
| Node24、npm install | 远程PASS |
| 真实锁文件 | 已原样入库，npm ci复验PASS（运行#6） |
| TypeScript、双构建 | 远程PASS（运行#4/#5/#6） |
| Vitest | 11/11 PASS（运行#4/#5/#6） |
| 332项原断言及8个原始blob | 远程PASS，非机制测试 |
| F1 v0.2加载与静态依赖 | 远程PASS，AST自测10/10、0违规 |
| Chromium离线E2E | PASS（运行#4/#5/#6） |
| Windows实际Chrome/Edge及Firefox兼容、字体 | 未验收；Linux Chromium headless不是全部平台 |
| G2-A阶段验收 | 基础工程PASS；平台覆盖有限 |
| G2-B | 未启动 |

本轮完成G2-A基准工程验证，不自行启动G2-B或登记新的用户决策。Windows真实浏览器与字体兼容、真实政治引擎及存档仍待后续验证；不得把试验页当作可玩游戏。

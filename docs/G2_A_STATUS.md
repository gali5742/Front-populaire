# G2-A · 工具链及基础契约
状态：STARTED / REMOTE BUILD AND BROWSER PASS / LOCKED RECHECK PENDING；2026-11-27。D87授权G2-A。工程试验，不是可玩游戏。

## 远程实测
[运行#3](https://github.com/gali5742/Front-populaire/actions/runs/45956121730)，提交9475907e97dda69cba62981d3497220766e0652b，job 140362874922：Node v24.22.3，Ubuntu runner，依赖安装、锁文件归档、TypeScript类型检查、验收登记及8个原始blob核对、F1 v0.2配置校验、AST边界自测10/10（6个源文件、0违规）、Vitest 4个测试文件11项全部通过、标准与离线构建、Chromium安装通过。Chromium headless shell 159.0.8154.6。332项机制验收仍全部NOT_RUN。
[运行#1](https://github.com/gali5742/Front-populaire/actions/runs/45955579460)、[运行#2](https://github.com/gali5742/Front-populaire/actions/runs/45955950724)、运行#3均在同一E2E断言失败：getByRole('status')同时匹配隐含status角色的output计数器及显式role=status的导入反馈，Playwright strict mode violation；实际日志显示导入失败反馈正确出现，计数为1。修复：存档操作反馈独立可访问名称；原测试断言保留，补测刷新归零及成功导入反馈。
[运行#4](https://github.com/gali5742/Front-populaire/actions/runs/45956854837)，提交52fca3fe4541367877ba4426e6bb980f76f6b69f，job 140365217177：全部步骤PASS，4个Vitest文件11/11、Playwright离线E2E 1/1（断网file://、交互、导出、刷新、成功导入、损坏导入保留旧状态、无外网请求与页面错误）。实际下载HTML artifact 15178972778：224097字节，SHA256 c790c9881e2ea9be63ac4fc608a975334299f1ec7c7fab7f6ff854986b71b6ba；HTML解析确认一个经典script标签、无外部HTML资源引用，zh-CN和四项系统宋体回退声明存在。不同OS字体呈现尚未确认。
[运行#5](https://github.com/gali5742/Front-populaire/actions/runs/45957157046)，提交67d20f07262700bb1408fb3f62d946aef82eb128，job 140366185955：全部步骤PASS；一次性只读锁文件恢复步骤验证SHA256并导出已审阅字节，未扩大CI权限。运行#3/#4实际下载锁文件字节一致，53,909字节，lockfileVersion 3，105个packages条目，依赖resolved来源仅registry.npmjs.org。锁文件SHA256 520e94729de7d861e03bd01ea4f39fdc19d83c36533220bc4f17b29388a3c7a1，Git blob d6ccfbee517029f59671d2b387b0505b4334bf04。此次提交将该实际生成文件原样入库，移除一次性恢复步骤及npm install回退，CI改为npm ci；需对锁定版本重新执行完整CI，尚未获得复验结果。
此前独立JS检查（11项、F1 20项、边界策略14项）、Python随机向量5/5及原始blob核对保留。F1 v0.2基准修复f1-issue及主体引用；v0.1七个测试意图与金额不变。真实政治引擎、存档契约、情境执行未实施。本地Node22及npm registry网络阻断仍存在，但远程已可执行。

## 验收状态
| 项目 | 状态 |
|---|---|
| G1 v0.2技术方向 | D87确认 |
| Node24、npm install | 远程PASS |
| 真实锁文件 | 已原样入库，npm ci复验待完成 |
| TypeScript、双构建 | 远程PASS（运行#4/#5） |
| Vitest | 11/11 PASS（运行#4/#5） |
| 332项原断言及8个原始blob | 远程PASS，非机制测试 |
| F1 v0.2加载与静态依赖 | 远程PASS，AST自测10/10、0违规 |
| Chromium离线E2E | PASS（运行#4/#5） |
| Windows实际Chrome/Edge及Firefox兼容、字体 | 未验收；Linux Chromium headless不是全部平台 |
| G2-A阶段验收 | 锁定依赖完整复验待完成 |
| G2-B | 未启动 |

G2-A关闭前须核验本次锁定依赖提交的npm ci及完整CI；记录浏览器覆盖范围，未测试平台不得宣称已通过。不得把试验页当作可玩游戏。

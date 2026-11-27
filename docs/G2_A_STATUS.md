# G2-A · 工具链及基础契约
状态：STARTED / PARTIAL / VALIDATION BLOCKED；2026-11-27。D87授权G2-A。以下是真实工程试验代码，不是可玩游戏。

本轮新增双构建入口、React工程试验页、公共会话类型、键控随机、CSV对账及单元/浏览器测试代码。未实现真实政治引擎或完整存档契约。新增F1 v0.2明确schema的加载校验，不执行政治规则。npm registry在当前验证环境无法解析（EAI_AGAIN）；Node 22.16.0/npm 10.9.2非目标Node24，未安装项目依赖、未生成锁文件、未执行TypeScript/React/Vite/Vitest/Playwright完整验收。package.json版本范围是待解析候选，锁定以真实安装与锁文件为准。

实际执行：在JS执行环境中运行与提交文件同源函数体，11项针对随机和CSV对账的检查均通过；332项当前原断言一致，全部NOT_RUN。固定向量由本实现生成；另用独立Python UTF-16LE/FNV-1a64/SplitMix64实现实际交叉核验，5/5一致。此结果不等于Node/Vitest/浏览器运行通过。本轮通过GitHub原始blob接口取回8份登记源文档，332条来源原断言逐项匹配。F1 v0.2修复原v0.1未定义f1-issue引用，以明确初始议题、主体引用、策略/处理器标识形成可解析基准；原v0.1保留（含7个非执行测试情境），数值不变。20项JS加载/错误配置测试通过；边界策略14项JS检查通过，TypeScript AST扫描/自测待目标工具链执行。真实存档及政治命令仍待实施/验证。

## 验收状态
| 项目 | 状态 |
|---|---|
| G1 v0.2技术方向 | D87确认 |
| 332项原断言对账（JS执行） | PASS，非机制测试 |
| 键控随机初步隔离及范围（JS执行） | PASS，独立Python向量5/5一致，待目标工具链 |
| Node24、npm安装、锁文件 | BLOCKED，网络不可用 |
| TypeScript、双构建、Vitest、Playwright | NOT_RUN |
| F1 v0.2基准schema及加载 | PASS（20项JS检查）；7个场景仍是测试意图 |
| 静态依赖边界 | 14项策略检查PASS；TypeScript AST扫描及自测待运行 |
| 8份原始验收blob | PASS（332项原文一致）；Git本地历史检查脚本待运行 |
| G2-A阶段验收 | BLOCKED / 未通过 |
| G2-B | 未启动 |

另增加离线构建的production环境常量与试验存档会话适配器，尚未浏览器验证。待实际目标环境安装依赖、生成并提交真实package-lock.json、运行npm run check及npm run test:e2e、运行新增配置/依赖检查、完整Git来源对账，记录机器/浏览器及日志后再判定G2-A。不得将试验页作为游戏发布。

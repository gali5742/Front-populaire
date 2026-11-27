# G2-A · 工具链及基础契约
状态：STARTED / PARTIAL / VALIDATION BLOCKED；2026-11-27。D87授权G2-A。以下是真实工程试验代码，不是可玩游戏。

本轮新增双构建入口、React工程试验页、公共会话类型、键控随机、CSV对账及单元/浏览器测试代码。未实现真实政治引擎、F1加载器或完整存档契约。npm registry在当前验证环境无法解析（EAI_AGAIN）；Node 22.16.0/npm 10.9.2非目标Node24，未安装项目依赖、未生成锁文件、未执行TypeScript/React/Vite/Vitest/Playwright完整验收。package.json版本范围是待解析候选，锁定以真实安装与锁文件为准。

实际执行：在JS执行环境中运行与提交文件同源函数体，11项针对随机和CSV对账的检查均通过；332项当前原断言一致，全部NOT_RUN。固定向量由本实现生成，尚未由独立实现交叉核验。此结果不等于Node/Vitest/浏览器运行通过。历史来源blob实际可达性、配置schema、静态依赖检查、真实存档及政治命令仍待实施/验证。

## 验收状态
| 项目 | 状态 |
|---|---|
| G1 v0.2技术方向 | D87确认 |
| 332项原断言对账（JS执行） | PASS，非机制测试 |
| 键控随机初步隔离及范围（JS执行） | PASS，待独立向量与目标工具链 |
| Node24、npm安装、锁文件 | BLOCKED，网络不可用 |
| TypeScript、双构建、Vitest、Playwright | NOT_RUN |
| F1可执行schema与依赖边界 | NOT_RUN，尚未完成实现 |
| G2-A阶段验收 | BLOCKED / 未通过 |
| G2-B | 未启动 |

待实际目标环境安装依赖、生成并提交真实package-lock.json、运行npm run check及npm run test:e2e、完成配置验证与静态边界，记录机器/浏览器及日志后再判定G2-A。不得将试验页作为游戏发布。

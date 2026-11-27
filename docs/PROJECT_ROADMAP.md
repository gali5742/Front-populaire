# 人民阵线 · 项目规划
归档日期：2026-11-26。依据此前讨论整理，不是新的机制授权。

## 项目定位
法国第三共和国人民阵线时期的单人历史政治模拟。玩家代表法国工人国际支部（SFIO）中央领导层，而不是国家本身，也不是全知的历史操作者。通过党内决议、群众组织、议会斗争、政治联盟及执政实践改变历史走向。参考 Autumn Chen 的 Social Democracy 类政治模拟，但本项目独立设计。

## 阶段与验收门
| 阶段 | 范围 | 状态 |
|---|---|---|
| Phase 0 | 历史资料广泛收集、来源登记、差异与缺口 | v0.6 CLOSED_WITH_GAPS，允许移交，不等于史料完整 |
| Phase 0.5A | 资料评估与模拟范围取舍 | 已完成讨论，保留不进入机制的资料 |
| Phase 0.5B | 核心机制与简化边界 | 基本同意，实际体验困难时再修改；参数未冻结 |
| Phase 0.5C | UI与视觉设计 | UI01–UI08主要页面及关键状态视觉基准已获确认；58张PNG全部核验归档（含V2新增34张），待上传0张；实际交互和机制验收尚未完成，已进入实施前机制细化 |
| Phase 0.5D | 实施前机制细化 | G0已收束（D85，2026-11-27）；D1、[D2政治主体与议题模型](MECHANISM_D2_DRAFT.md) v0.2原则通过；[D3党内政治制度](MECHANISM_D3_DRAFT.md) v0.2原则通过（D80）；[D4党际关系与群众运动](MECHANISM_D4_DRAFT.md) v0.2原则通过（D81）；[D5议会与政府](MECHANISM_D5_DRAFT.md) v0.2原则通过（D82）；[D6选举](MECHANISM_D6_DRAFT.md) v0.2及配套补丁原则通过（D83）；[D7经济与社会反馈](MECHANISM_D7_DRAFT.md) v0.2及配套补丁原则通过（D84）；[D8历史初始化与综合验收](MECHANISM_D8_DRAFT.md) v0.2及R01–R05原则通过（D85；332项设计验收用例未运行，G1已获启动授权D86）；[审计与阶段规划](MECHANISM_DESIGN_DRAFT.md)，未进入代码开发 |
| G1 | 原型启动准备 | D86启动授权；[实施方案v0.2](G1_IMPLEMENTATION_PLAN.md)及R01–R05按D87通过；技术方向锁定，实际依赖与运行待验 |
| G2-A | 工具链及基础契约 | D87授权；[基础工程验证通过](G2_A_STATUS.md)（锁定依赖、Linux Chromium；平台覆盖有限） |
| G2-B | 首个纵向政治闭环 | D88启动授权；[实现与测试状态](G2_B_STATUS.md)，待CI验收 |
| G2-C至G6 | 调度项目、自主主体、党内联盟、议会政府及选举、经济综合、历史可玩验收 | 未启动 |

用户明确要求：先形成图形化UI方案，再进入开发。不得把后续实现的建议当作现有实现状态。G1已启动；G2–G6阶段编号按D85，具体技术选型、任务拆分及实施授权待确认；建议先实现核心回合与政治行动最小闭环，再逐步加入党内、议会、选举、内阁及历史内容，最后开展全流程与可玩性测试。

## 已确定时间范围
1934-01 至 1938-12，共60个月；每月2次主动行动。历史研究的核心时间范围1932–1939，向前后延伸用于理解制度、历史因果和后续结果，不与游玩范围混同。

## 阶段产物
- 历史资料：[Phase 0 v0.6](../research/phase0-v06/README.md)、[交接说明](../research/phase0-v06/PHASE0_HANDOFF.md)。
- 核心设计：[GAME_DESIGN](GAME_DESIGN.md)、[SIMULATION_SPEC](SIMULATION_SPEC.md)、[实施前机制候选](MECHANISM_DESIGN_DRAFT.md)、[HISTORICAL_MODEL](HISTORICAL_MODEL.md)。
- 视觉与交互：[设计规范](../design/UI_DESIGN_SYSTEM.md)、[UI01](../design/UI01_SPEC.md)、[UI02](../design/UI02_SPEC.md)、[UI03](../design/UI03_SPEC.md)、[UI04](../design/UI04_SPEC.md)、[全套V2验收](../design/UI_SUITE_V2_SPEC.md)、[后续UI规划](../design/UI_ROADMAP.md)。
- [决策记录](DECISION_LOG.md)、[遗留问题](OPEN_ISSUES.md)。
- 进入开发前：原图归档已完成；补齐遗留子交互与实际交互验收规划；确定最小可运行规则、初始状态、数据接口、回合顺序、条件与成本校验；明确历史缺失的处理，不要求先补齐全部30专题原始档案。

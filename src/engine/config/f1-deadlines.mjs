import {rawFixture} from "./f1-bundled.mjs";
const c=JSON.parse(rawFixture);
c.display_label="F1 合成规则测试（非1934史实）· 硬检查点测试夹具";
c.initial.hard_checkpoints=[{id:"first-a",month:0,day:26,title:"测试截止事项A",description:"合成期限：26日须记录回应。"},{id:"first-b",month:0,day:26,title:"测试截止事项B",description:"合成期限：26日独立事项。"},{id:"later",month:0,day:29,title:"测试截止事项C",description:"合成期限：29日须记录回应。",after:["first-a","first-b"]}];
export const deadlineFixture=JSON.stringify(c);

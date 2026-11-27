import {rawFixture} from "./f1-bundled.mjs";
const c=JSON.parse(rawFixture);
c.display_label="F1 合成规则测试（非1934史实）· 支付冲突测试夹具";
c.initial.party_cash=700000;
c.parameters.monthly_income=300000;
c.parameters.monthly_routine_due=0;
c.initial.binding_dues=[{id:"a",month:0,amount:500000,priority:0,dedicated:0},{id:"b",month:0,amount:500000,priority:0,dedicated:0},{id:"independent",month:0,amount:200000,priority:0,dedicated:200000}];
export const paymentFixture=JSON.stringify(c);

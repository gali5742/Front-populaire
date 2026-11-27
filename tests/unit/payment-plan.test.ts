import {it,expect} from "vitest";
import {planDuePayments} from "../../src/engine/core/payment-plan.mjs";
const a={id:"a",month:0,priority:0,amount:500000,reserve:0},b={...a,id:"b"},d={...a,id:"d",amount:200000,reserve:200000};
it("does not choose a winner under order reversal; independent payment remains",()=>{for(const rows of [[a,b,d],[d,b,a]]){const p=planDuePayments(1000000,200000,rows);expect(p.payIds).toEqual(["d"]);expect(p.restricted).toBe(800000);expect(p.conflict?.ids).toEqual(["a","b"])}});
it("strict earlier due and declared priority, no unapproved partial allocations",()=>{const p=planDuePayments(600000,0,[{...a,id:"later",month:1},{...a,id:"low",priority:1},a]);expect(p.payIds).toEqual(["a"]);expect(p.restricted).toBe(100000);expect(p.conflict?.ids).toEqual(["low"]);});
it("preserves partially dedicated allocations and future earmarks",()=>{const p=planDuePayments(1000000,400000,[{...a,reserve:100000},b,d]);expect(p.payIds).toEqual(["d"]);expect(p.restricted).toBe(600000);expect(p.conflict?.unbacked).toBe(900000);expect(()=>planDuePayments(100,101,[])).toThrow();});

import {describe,it,expect} from "vitest";
import {draw64,uniformInt} from "../../src/engine/core/keyed-random.mjs";
const vectors=[
  {
    "key": [
      19340101,
      "D2",
      "contact-a",
      "reply",
      "party-a",
      0
    ],
    "hex": "585ff539c05031a4"
  },
  {
    "key": [
      19340101,
      "D6",
      "election-1",
      "turnout",
      "district-1",
      0
    ],
    "hex": "68f6943f543a0471"
  },
  {
    "key": [
      19340101,
      "D6",
      "election-1",
      "turnout",
      "district-2",
      0
    ],
    "hex": "62f668fc77b46d57"
  },
  {
    "key": [
      0,
      "工程",
      "事务",
      "用途",
      "对象",
      0
    ],
    "hex": "58a955eacfa2749c"
  },
  {
    "key": [
      19340101,
      "D2",
      "contact-a",
      "reply",
      "party-a",
      1
    ],
    "hex": "e053811c989e0ba1"
  }
] as const;
describe("keyed random v1",()=>{
 it("fixed vectors",()=>{for(const v of vectors)expect(draw64(...v.key).toString(16).padStart(16,"0")).toBe(v.hex)});
 it("unrelated draw and reordered objects do not shift keys",()=>{const a=draw64(...vectors[0].key);draw64(...vectors[2].key);draw64(...vectors[1].key);expect(draw64(...vectors[0].key)).toBe(a)});
 it("valid range and malformed inputs",()=>{for(const b of [1,2,3,100,Number.MAX_SAFE_INTEGER]){const v=uniformInt(1,"D2","t","p","o",b);expect(v).toBeGreaterThanOrEqual(0);expect(v).toBeLessThan(b)}expect(()=>uniformInt(1,"D2","t","p","o",0)).toThrow()});
});

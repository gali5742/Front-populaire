import {it,expect} from "vitest";
import {parseCsv,auditRegistry} from "../../scripts/lib/acceptance.mjs";
const spec=[{path:"d.md",prefix:"T",count:1}];
const source={"d.md":"| T01 | 示例 | 预期 |\n"};
const head="case_id,source_path,source_blob_sha,scenario,expected,primary_target_gate,integrated_recheck_gate,planned_profile,status,test_ref,fixture_ref,seed,actual,run_version,defect_id\n";
const row="T01,d.md,0123456789012345678901234567890123456789,示例,预期,G2,G5,F1,NOT_RUN,,,,,,\n";
it("parses quoted CSV",()=>expect(parseCsv('"a","b""c","d\ne"\r\n')).toEqual([["a",'b"c',"d\ne"]]));
it("accepts unchanged assertions after metadata edit",()=>expect(auditRegistry(head+row,{"d.md":source["d.md"]+"\nstatus updated"},spec).count).toBe(1));
it("rejects missing, duplicate and drift",()=>{expect(()=>auditRegistry(head,source,spec)).toThrow();expect(()=>auditRegistry(head+row+row,source,spec)).toThrow();expect(()=>auditRegistry(head+row.replace("预期","变化"),source,spec)).toThrow()});

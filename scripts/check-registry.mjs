import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { auditRegistry, parseCsv, extractCases } from "./lib/acceptance.mjs";
const specs=[
  {
    "path": "docs/MECHANISM_DESIGN_DRAFT.md",
    "prefix": "T",
    "count": 34
  },
  {
    "path": "docs/MECHANISM_D2_DRAFT.md",
    "prefix": "P",
    "count": 24
  },
  {
    "path": "docs/MECHANISM_D3_DRAFT.md",
    "prefix": "S",
    "count": 36
  },
  {
    "path": "docs/MECHANISM_D4_DRAFT.md",
    "prefix": "A",
    "count": 42
  },
  {
    "path": "docs/MECHANISM_D5_DRAFT.md",
    "prefix": "L",
    "count": 50
  },
  {
    "path": "docs/MECHANISM_D6_DRAFT.md",
    "prefix": "E",
    "count": 56
  },
  {
    "path": "docs/MECHANISM_D7_DRAFT.md",
    "prefix": "K",
    "count": 56
  },
  {
    "path": "docs/MECHANISM_D8_DRAFT.md",
    "prefix": "I",
    "count": 34
  }
];
const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const sources=Object.fromEntries(specs.map(s=>[s.path,read(s.path)]));
const result=auditRegistry(read("docs/ACCEPTANCE_REGISTER.csv"),sources,specs);
// Verify frozen source blobs, not current document hashes. Full Git history required.
const rows=parseCsv(read("docs/ACCEPTANCE_REGISTER.csv")).slice(1);
const blobs=new Map();
for(const spec of specs){
 const subset=rows.filter(r=>r[1]===spec.path);
 const hashes=[...new Set(subset.map(r=>r[2]))];
 for(const sha of hashes){
  let source=blobs.get(sha);
  if(source===undefined){
   try{source=execFileSync("git",["cat-file","blob",sha],{cwd:fileURLToPath(root),encoding:"utf8",maxBuffer:2*1024*1024});}
   catch{throw Error("original acceptance blob unavailable: "+sha+"; full git history required");}
   blobs.set(sha,source);
  }
  const originals=new Map(extractCases(source,spec.prefix,spec.count).map(x=>[x.id,x]));
  for(const row of subset.filter(r=>r[2]===sha)){
   const original=originals.get(row[0]);
   if(!original||original.scenario!==row[3]||original.expected!==row[4])throw Error("original assertion mismatch "+row[0]);
  }
 }
}
console.log(JSON.stringify({...result,verifiedOriginalBlobs:blobs.size}));

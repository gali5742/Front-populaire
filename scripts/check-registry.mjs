import { readFileSync } from "node:fs";
import { auditRegistry } from "./lib/acceptance.mjs";
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
console.log(JSON.stringify(result));
// Source SHA is original provenance, not current document equality.
// Historical blob availability must be independently audited against Git history.

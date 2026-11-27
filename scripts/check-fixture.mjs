import {readFileSync} from "node:fs";
import {loadF1} from "../src/engine/config/f1-schema.mjs";
import {rawFixture} from "../src/engine/config/f1-bundled.mjs";
const source=readFileSync(new URL("../data/fixtures/f1-g2-core-v02.json",import.meta.url),"utf8");
if(source!==rawFixture)throw Error("bundled fixture differs from canonical fixture");
const x=loadF1(source);
console.log(JSON.stringify({profile:x.profile_id,schema:x.schema_version,actions:x.actions.length,actors:x.initial.actors.length,issues:x.initial.issues.length,synthetic:x.synthetic}));

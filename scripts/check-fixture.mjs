import {readFileSync} from "node:fs";
import {loadF1} from "../src/engine/config/f1-schema.mjs";
const x=loadF1(readFileSync(new URL("../data/fixtures/f1-g2-core-v02.json",import.meta.url),"utf8"));
console.log(JSON.stringify({profile:x.profile_id,schema:x.schema_version,actions:x.actions.length,actors:x.initial.actors.length,issues:x.initial.issues.length,synthetic:x.synthetic}));

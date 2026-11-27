export function parseCsv(source) {
  if(typeof source!=="string")throw new TypeError("CSV text required");
  source=source.replace(/^\uFEFF/,"");
  const rows=[];let row=[],field="",quoted=false,closed=false,started=false;
  const finishField=()=>{row.push(field);field="";closed=false;started=false;};
  const finishRow=()=>{finishField();rows.push(row);row=[];};
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c===","){finishField();continue;}
    if(c==="\n"||c==="\r"){if(c==="\r"&&source[i+1]==="\n")i++;finishRow();continue;}
    if(closed)throw new Error("unexpected character after quoted CSV field");
    if(c==='"'){if(started)throw new Error("quote in unquoted CSV field");quoted=true;started=true;continue;}
    field+=c;started=true;
  }
  if(quoted)throw new Error("unterminated CSV quote");
  if(started||closed||row.length||field.length)finishRow();
  return rows;
}

export function extractCases(markdown,prefix,count){
  const items=[];
  for(const line of markdown.split(/\r?\n/)){
    const match=line.match(/^\|\s*([A-Z]\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
    if(match&&match[1].startsWith(prefix))items.push({id:match[1],scenario:match[2].trim(),expected:match[3].trim()});
  }
  if(items.length!==count||items.some((x,i)=>x.id!==prefix+String(i+1).padStart(2,"0")))throw new Error("invalid source case sequence "+prefix);
  return items;
}

export function auditRegistry(csv, sources, specs) {
  const rows=parseCsv(csv);
  const columns=["case_id","source_path","source_blob_sha","scenario","expected","primary_target_gate","integrated_recheck_gate","planned_profile","status","test_ref","fixture_ref","seed","actual","run_version","defect_id"];
  if(!rows.length||JSON.stringify(rows[0])!==JSON.stringify(columns))throw new Error("registry header mismatch");
  const expected=new Map();
  for(const spec of specs){const source=sources[spec.path];if(typeof source!=="string")throw new Error("missing source "+spec.path);for(const x of extractCases(source,spec.prefix,spec.count)){if(expected.has(x.id))throw new Error("duplicate source case "+x.id);expected.set(x.id,{...x,path:spec.path});}}
  const seen=new Set(),gate=/^G[2-6]$/,status=new Set(["NOT_RUN","PASS","FAIL","BLOCKED","N/A"]);
  for(const row of rows.slice(1)){
    if(row.length!==columns.length)throw new Error("column count");
    const [id,path,sha,scenario,expect,primary,recheck,profile,state,test,fixture,seed,actual,version]=row;
    if(seen.has(id))throw new Error("duplicate "+id);seen.add(id);
    const x=expected.get(id);if(!x||path!==x.path||scenario!==x.scenario||expect!==x.expected)throw new Error("assertion mismatch "+id);
    if(!/^[0-9a-f]{40}$/.test(sha)||!gate.test(primary)||!gate.test(recheck)||Number(recheck[1])<Number(primary[1])||!["F1","F1/F2","F2","F3"].includes(profile)||!status.has(state))throw new Error("invalid metadata "+id);
    if(state==="NOT_RUN"&&(actual||version))throw new Error("NOT_RUN has result "+id);
    if(["PASS","FAIL"].includes(state)&&(!test||!fixture||!actual||!version))throw new Error("missing execution evidence "+id);
    if(["BLOCKED","N/A"].includes(state)&&!actual)throw new Error("missing reason "+id);
  }
  if(seen.size!==expected.size)throw new Error("missing cases");
  return {count:seen.size,notRun:rows.slice(1).filter(r=>r[8]==="NOT_RUN").length};
}

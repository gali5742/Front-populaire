// G2-A: explicit schema for the synthetic core fixture only; no political effects executed.
export function validateF1(input) {
 const fail=(p,m)=>{throw new Error(p+": "+m)};
 const object=(v,p,required,optional=[])=>{if(v===null||typeof v!=="object"||Array.isArray(v))fail(p,"object required");const keys=Object.keys(v);for(const k of required)if(!Object.prototype.hasOwnProperty.call(v,k))fail(p,"missing "+k);for(const k of keys)if(!required.includes(k)&&!optional.includes(k))fail(p,"unknown "+k);return v;};
 const str=(v,p)=>{if(typeof v!=="string"||!v.trim()||v.length>4096)fail(p,"nonempty bounded string required");return v};
 const id=(v,p)=>{if(typeof v!=="string"||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v)||["constructor","prototype","__proto__"].includes(v))fail(p,"invalid id");return v};
 const integer=(v,p,min=0,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail(p,"integer out of range");return v};
 const one=(v,p,values)=>{if(!values.includes(v))fail(p,"unsupported value");return v};
 const arr=(v,p,min=1,max=256)=>{if(!Array.isArray(v)||v.length<min||v.length>max)fail(p,"array length");return v};
 const unique=(list,p)=>{const s=new Set(list);if(s.size!==list.length)fail(p,"duplicate");return s};
 const equals=(v,p,expected)=>{if(v!==expected)fail(p,"expected "+expected)};
 const refs=(a,p,valid,min=1)=>{arr(a,p,min);unique(a.map((v,i)=>id(v,p+"["+i+"]")),p);for(const v of a)if(!valid.has(v))fail(p,"unknown reference "+v);};
 object(input,"fixture",["schema_version","profile_id","synthetic","assumption_id","display_label","seed","clock","currency","initial","parameters","actions"]);
 equals(input.schema_version,"schema_version","0.2");equals(input.profile_id,"profile_id","F1-G2-CORE-001");equals(input.synthetic,"synthetic",true);id(input.assumption_id,"assumption_id");str(input.display_label,"display_label");integer(input.seed,"seed");
 const c=object(input.clock,"clock",["start_month","end_month","initial_month_index","action_allowance","initial_phase"]);
 equals(c.start_month,"clock.start_month","1934-01");equals(c.end_month,"clock.end_month","1938-12");equals(c.initial_month_index,"clock.initial_month_index",0);equals(c.action_allowance,"clock.action_allowance",2);equals(c.initial_phase,"clock.initial_phase","month_entry");
 const currency=object(input.currency,"currency",["unit","centimes_per_franc"]);equals(currency.unit,"currency.unit","centime");equals(currency.centimes_per_franc,"currency.centimes_per_franc",100);
 const i=object(input.initial,"initial",["party_cash","spent_ap","reserved_ap","reserved_cash","restricted_cash","members","chamber_seats","actors","facts","issues"],["hard_checkpoints","binding_dues"]);
 for(const k of ["party_cash","spent_ap","reserved_ap","reserved_cash","restricted_cash"])integer(i[k],"initial."+k);
 if(i.spent_ap+i.reserved_ap>2||i.reserved_cash>i.party_cash-i.restricted_cash)fail("initial","resource conservation");
 // This baseline has no backing reservation records; nonzero pre-entry budgets cannot be loaded.
 for(const k of ["spent_ap","reserved_ap","reserved_cash","restricted_cash"])equals(i[k],"initial."+k,0);
 equals(i.members,"initial.members",null);equals(i.chamber_seats,"initial.chamber_seats",null);
 const capabilities=new Set(["contact","organize","plan_project","respond","cancel_pending","reply","independent_action"]);
 const actors=arr(i.actors,"initial.actors").map((a,j)=>{const p="actors["+j+"]";object(a,p,["id","kind","name","capabilities"],["private_preference"]);id(a.id,p+".id");one(a.kind,p+".kind",["player_central","party","union"]);str(a.name,p+".name");refs(a.capabilities,p+".capabilities",capabilities);
 if(a.kind==="party"){object(a.private_preference,p+".private_preference",["statement","coordination"]);for(const k of ["statement","coordination"])one(a.private_preference[k],p+"."+k,["accept","reject","wait"]);}else if("private_preference" in a)fail(p,"unsupported private preference");return a;});
 const actorIds=unique(actors.map(a=>a.id),"actor ids"),central=actors.filter(a=>a.kind==="player_central");
 if(central.length!==1)fail("actors","exactly one player central required");
 for(const a of actors){const allowed=a.kind==="player_central"?["contact","organize","plan_project","respond","cancel_pending"]:a.kind==="party"?["reply"]:["independent_action"];for(const k of a.capabilities)one(k,"actor capability",allowed);}
 const facts=arr(i.facts,"facts").map((f,j)=>{const p="facts["+j+"]";object(f,p,["id","type","actor_id","text","occurred","disclosed","audience"]);id(f.id,p+".id");one(f.type,p+".type",["public_statement"]);refs([f.actor_id],p+".actor",actorIds);str(f.text,p+".text");for(const key of ["occurred","disclosed"]){object(f[key],p+"."+key,["month","slot"]);equals(f[key].month,p+"."+key+".month",0);equals(f[key].slot,p+"."+key+".slot","opening");}equals(f.audience,p+".audience","public");return f;});
 const factIds=unique(facts.map(f=>f.id),"fact ids");
 const variants=new Set(["statement","coordination"]);
 const issues=arr(i.issues,"issues").map((a,j)=>{const p="issues["+j+"]";object(a,p,["id","participants","variants","initial_status","source_fact_id"]);id(a.id,p+".id");refs(a.participants,p+".participants",actorIds,2);if(!a.participants.includes(central[0].id))fail(p,"central missing");refs(a.variants,p+".variants",variants);equals(a.initial_status,p+".initial_status","open");refs([a.source_fact_id],p+".source",factIds);if(!a.participants.includes(facts.find(f=>f.id===a.source_fact_id).actor_id))fail(p,"source actor outside issue");return a;});
 const issueIds=unique(issues.map(a=>a.id),"issue ids");
 const p=object(input.parameters,"parameters",["monthly_income","monthly_routine_due","project_execution_months","project_month_fee","project_start_fee","project_start_ap","negotiation_max_exchanges","policies"]);
 for(const k of ["monthly_income","monthly_routine_due","project_month_fee","project_start_fee"])integer(p[k],"parameters."+k);
 integer(p.project_execution_months,"project_execution_months",1,60);integer(p.project_start_ap,"project_start_ap",1,2);integer(p.negotiation_max_exchanges,"negotiation_max_exchanges",1,2);
 if(i.party_cash>Number.MAX_SAFE_INTEGER-p.monthly_income)fail("parameters","first entry cash overflow");
 const policies={entry:"FIRST_MONTH_INCLUDED",contact_response:"NEXT_DECLARED_CHECKPOINT",project_start:"UNDATED_MONTH_END",first_payment:"NEXT_MONTH_ENTRY",reservation:"ONE_NEXT_EXECUTION_MONTH",unfunded:"PAUSE_FIXED_END",project_change:"NEXT_EXECUTION_MONTH",shortfall:"NO_UNAUTHORIZED_ALLOCATION",negotiation:"FINITE_ADMISSIBLE_VARIANTS",randomness:"NONE_BASELINE"};
 object(p.policies,"policies",Object.keys(policies));for(const [k,v] of Object.entries(policies))equals(p.policies[k],"policies."+k,v);
 const handlers={CONTACT:["immediate","contact",1],SCHEDULE_ORGANIZATION:["scheduled","organize",1],START_PROJECT:["project","plan_project",p.project_start_ap],ACKNOWLEDGE:["required_response","respond",0],CANCEL_PENDING:["cancel","cancel_pending",0],PAUSE_PROJECT:["routine_adjustment","plan_project",0],ACCEPT_SHORTFALL:["shortfall_response","respond",0]};
 const actions=arr(input.actions,"actions").map((a,j)=>{const q="actions["+j+"]";if(!a||typeof a!=="object"||Array.isArray(a)||!Object.prototype.hasOwnProperty.call(handlers,a.handler))fail(q,"unknown handler");const [kind,cap,ap]=handlers[a.handler];const extra=a.handler==="CONTACT"?["issue","variant","target_actor_id"]:a.handler==="START_PROJECT"?["reserve_first_fee","duration","monthly_fee"]:a.handler==="SCHEDULE_ORGANIZATION"?["execution"]:[];
 object(a,q,["id","kind","ap","cost","requires","handler",...extra]);id(a.id,q+".id");equals(a.kind,q+".kind",kind);equals(a.ap,q+".ap",ap);integer(a.cost,q+".cost");refs(a.requires,q+".requires",new Set(central[0].capabilities));if(a.requires.length!==1||a.requires[0]!==cap)fail(q,"incorrect capability");if(ap===0)equals(a.cost,q+".cost",0);
 if(a.handler==="CONTACT"){refs([a.issue],q+".issue",issueIds);const issue=issues.find(x=>x.id===a.issue);refs([a.variant],q+".variant",new Set(issue.variants));refs([a.target_actor_id],q+".target",new Set(issue.participants));const target=actors.find(x=>x.id===a.target_actor_id);if(target.kind!=="party"||!target.capabilities.includes("reply"))fail(q,"invalid reply actor");}
 if(a.handler==="START_PROJECT"){equals(a.cost,q+".cost",p.project_start_fee);equals(a.reserve_first_fee,q+".reserve",p.project_month_fee);equals(a.duration,q+".duration",p.project_execution_months);equals(a.monthly_fee,q+".monthly_fee",p.project_month_fee);}
 if(a.handler==="SCHEDULE_ORGANIZATION")equals(a.execution,q+".execution","undated month end");return a;});
 unique(actions.map(a=>a.id),"action ids");
 for(const h of Object.keys(handlers))if(!actions.some(a=>a.handler===h))fail("actions","missing "+h);
 for(const issue of issues)for(const variant of issue.variants)if(!actions.some(a=>a.handler==="CONTACT"&&a.issue===issue.id&&a.variant===variant))fail("actions","missing contact variant");
 if(i.binding_dues!==undefined){
  const list=arr(i.binding_dues,"binding dues",0,64);
  unique(list.map(e=>{object(e,"binding due",["id","month","amount","priority","dedicated"]);id(e.id,"binding id");if(e.id.length>100)fail("binding id","too long");integer(e.month,"binding month",0,59);integer(e.amount,"binding amount",1);integer(e.priority,"binding priority",0,9);integer(e.dedicated,"binding dedicated",0,e.amount);return e.id;}),"binding IDs");
  const total=list.reduce((n,e)=>n+e.dedicated,0);
  integer(total,"total dedicated",0,i.party_cash);
  integer(list.reduce((n,e)=>n+e.amount,0),"total binding amount");
 }
 if(i.hard_checkpoints!==undefined){
  const events=arr(i.hard_checkpoints,"hard_checkpoints",0,32);
  unique(events.map(e=>{object(e,"hard checkpoint",["id","month","day","title","description"],["after"]);id(e.id,"checkpoint id");if(e.id.length>100)fail("checkpoint id","too long");integer(e.month,"checkpoint month",0,59);const y=1934+Math.floor(e.month/12),m=e.month%12;const days=[31,y%4===0&&(y%100!==0||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];integer(e.day,"checkpoint deadline",1,days[m]);str(e.title,"checkpoint title");str(e.description,"checkpoint description");if(factIds.has("hard-"+e.id)||factIds.has("hard-"+e.id+"-ack"))fail("checkpoint","fact collision");return e.id;}),"checkpoint ids");
  const eventIds=new Set(events.map(e=>e.id));
  const generated=events.flatMap(e=>["hard-"+e.id,"hard-"+e.id+"-ack"]);unique(generated,"generated checkpoint facts");
  for(const e of events){if(e.after!==undefined){refs(e.after,"checkpoint dependencies",eventIds,0);for(const dep of e.after){const parent=events.find(x=>x.id===dep);if(parent.month!==e.month||parent.day>e.day||dep===e.id)fail("checkpoint dependency","invalid date or self");}}}
  const done=new Set();while(done.size<events.length){const ready=events.filter(e=>!done.has(e.id)&&(e.after??[]).every(id=>done.has(id)));if(!ready.length)fail("checkpoint dependencies","cycle");for(const e of ready)done.add(e.id);}
  if(events.length&&!central[0].capabilities.includes("respond"))fail("hard_checkpoints","zero-cost response unavailable");
 }
 return input;
}

export function loadF1(rawText){if(typeof rawText!=="string"||rawText.length>1048576)throw new Error("fixture text invalid or too large");const parsed=JSON.parse(rawText);validateF1(parsed);return parsed;}

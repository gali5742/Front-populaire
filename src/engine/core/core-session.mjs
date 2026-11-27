// G2-B: deliberately limited F1 vertical slice. All state private to the session.
import {loadF1} from "../config/f1-schema.mjs";
const RULES="g2-c-2", FORMAT="front-populaire-save-1";
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=m=>{throw new Error(m)};
const integer=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const keys=(x,ks)=>obj(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.prototype.hasOwnProperty.call(x,k));
const canonical=x=>JSON.stringify(x,(_k,v)=>obj(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function checksum(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),0x01000193)>>>0;return h.toString(16).padStart(8,"0")}
const monthLabel=m=>(1934+Math.floor(m/12))+"年"+(m%12+1)+"月";
const label=v=>v==="statement"?"共同声明":"组织协作";
const safeId=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(x)&&!["constructor","prototype","__proto__"].includes(x);
const draftKeys=["actionId","targetId","proposalVersion"];
const quoteKeys=["quoteId","allowed","ap","centimes","reason"];
function validDraft(d){return keys(d,draftKeys)&&draftKeys.every(k=>safeId(d[k]))}
function validQuote(q){return keys(q,quoteKeys)&&typeof q.quoteId==="string"&&q.quoteId.length<=512&&typeof q.allowed==="boolean"&&integer(q.ap,0,2)&&integer(q.centimes)&&typeof q.reason==="string"&&q.reason.length<=512}
function validCommand(c){return keys(c,["requestId","draft","confirmedQuote"])&&safeId(c.requestId)&&validDraft(c.draft)&&validQuote(c.confirmedQuote)}
function addFact(s,id,title,description,month=s.month,slot="decision"){
 if(s.facts.some(f=>f.id===id))fail("duplicate fact");
 s.facts.push({id,title,description,month,slot});
}
function transaction(s,id,delta,kind,ref){
 if(s.ledger.some(x=>x.id===id)||!Number.isSafeInteger(delta)||!integer(s.cash+delta))fail("ledger invariant");
 s.cash+=delta;s.ledger.push({id,month:s.month,delta,kind,ref});
}
// Reservation ownership is explicit. A planned project fee is not a debt.
const queued=s=>s.plans.filter(p=>p.status==="queued");
const reservedAP=s=>queued(s).reduce((n,p)=>n+p.ap,0);
const reservedMoney=s=>queued(s).reduce((n,p)=>n+p.amount,0)+s.projects.reduce((n,p)=>n+p.reserve,0);
const available=s=>s.cash-s.restricted-s.projectHold-reservedMoney(s);
const routineDue=s=>s.obligations.filter(o=>!o.paid).reduce((n,o)=>n+o.amount,0);
function reserveNext(s){
 // In F1 these are adjustable, equal-priority next-period plans.
 s.projectHold=0;
 for(const p of s.projects)p.reserve=0;
 const next=s.projects.filter(p=>p.status==="active"&&s.month<p.last);
 const demand=next.reduce((n,p)=>n+p.fee,0),pool=available(s);
 if(!integer(demand)||!integer(pool))fail("next reserve pool");
 if(demand<=pool){for(const p of next)p.reserve=p.fee;}
 else if(next.length===1)next[0].reserve=pool;
 else if(next.length){
  s.projectHold=pool;
  const id="project-reserve-short-"+s.month;
  if(!s.facts.some(f=>f.id===id))addFact(s,id,"下一期经费竞争","同级工作争用下一期资金；保留共享受限金额，不擅自选择分配对象。",s.month,"decision");
 }
}
function enter(s,c,m){
 if(m<0||m>=60||s.entered.includes(m))fail("entry invariant");
 s.month=m;s.entered.push(m);s.spent=0;s.phase="decision";
 if(c.parameters.monthly_income)transaction(s,"income-"+m,c.parameters.monthly_income,"income","monthly-income");
 const due=c.parameters.monthly_routine_due;
 if(due)s.obligations.push({id:"routine-"+m,month:m,amount:due,paid:false});
 const unpaid=s.obligations.filter(x=>!x.paid),total=routineDue(s);
 if(!integer(total))fail("obligation overflow");
 // F1 project fees are explicitly adjustable future plans, not binding obligations.
 // Release their old earmarks as a group before the higher priority routine obligations.
 for(const p of s.projects)p.reserve=0;
 s.projectHold=0;
 if(total<=s.cash){for(const o of unpaid){transaction(s,"pay-"+o.id,-o.amount,"routine",o.id);o.paid=true;}s.restricted=0;}
 else{s.restricted=Math.min(s.cash,total);addFact(s,"shortfall-"+m,"例行经费短缺","到期例行费用未获足额保障；保留实际未付义务和受限资金，不自动分配。",m,"opening");}
 const active=s.projects.filter(p=>p.status==="active"&&m>=p.first&&m<=p.last);
 const demand=active.reduce((n,p)=>n+p.fee,0);
 if(!integer(demand))fail("project demand overflow");
 if(demand<=available(s)){
  for(const p of active){transaction(s,p.id+"-fee-"+m,-p.fee,"project_month",p.id);p.paid.push(m);}
 }else{
  // Equal priority adjustable plans: no arbitrary winner or partial payment.
  for(const p of active){p.status="paused";addFact(s,p.id+"-short-"+m,"长期工作经费不足","本期未获合法足额经费，暂停；不计付费进展，不生成虚构债务。",m,"opening");}
 }
 reserveNext(s);
}
function initial(c){
 const s={month:0,phase:"entry",entered:[],sealed:[],cash:c.initial.party_cash,spent:0,restricted:0,projectHold:0,checkpoints:[],ledger:[],obligations:[],contacts:[],plans:[],projects:[],facts:c.initial.facts.map(f=>({id:f.id,title:"公开政治表态",description:f.text,month:0,slot:"opening"})),processed:[]};
 enter(s,c,0);return s;
}
function snapshot(s,c){
 return {time:{monthIndex:s.month,label:monthLabel(s.month),phase:s.phase},identity:c.initial.actors.find(a=>a.kind==="player_central").name,actionRemaining:s.phase==="ended"?0:2-s.spent-reservedAP(s),partyAvailableCentimes:available(s),partyCashCentimes:s.cash,restrictedCentimes:s.restricted+s.projectHold,reservedCentimes:reservedMoney(s),reservedAP:reservedAP(s),unpaidCentimes:routineDue(s),requiredBlock:s.phase==="required",workCount:s.contacts.filter(x=>x.status==="sent"||x.status==="waiting").length+queued(s).length+s.projects.filter(p=>["active","paused"].includes(p.status)).length,briefCount:s.facts.filter(f=>f.month===s.month).length,profileLabel:c.display_label};
}
function choices(s,c){
 if(s.phase==="required")return s.checkpoints.filter(x=>x.month===s.month&&!x.resolved).map(x=>({id:x.id,title:"回应："+x.title,description:x.description+"（不新增承诺；必须在本月截止前记录回应。）",draft:{actionId:"acknowledge_no_commitment",targetId:x.id,proposalVersion:"m"+s.month}}));
 if(s.phase!=="decision")return [];
 const base=c.actions.filter(a=>a.handler==="CONTACT").map(a=>({id:a.id,title:"就"+label(a.variant)+"发起磋商",description:"与"+c.initial.actors.find(x=>x.id===a.target_actor_id).name+"联系；对方将于下一声明检查点自主回应。",draft:{actionId:a.id,targetId:a.target_actor_id,proposalVersion:"v1"}}));
 const add=(a,title,description,target)=>base.push({id:a.id+"-"+target,title,description,draft:{actionId:a.id,targetId:target,proposalVersion:"m"+s.month}});
 for(const a of c.actions){
  if(a.handler==="SCHEDULE_ORGANIZATION")add(a,"安排组织活动","确认后预留行动与经费；本月底校验、执行并结算。","current_month");
  if(a.handler==="START_PROJECT")add(a,"安排三个月长期工作","月底启动，次月首付。仅预留启动费及首期资金，不预付全部费用。","current_month");
  if(a.handler==="CANCEL_PENDING")for(const p of queued(s))add(a,"撤销"+(p.kind==="project"?"长期工作安排":"组织活动安排"),"仅释放未执行预留，不返还已发生费用。",p.id);
  if(a.handler==="PAUSE_PROJECT")for(const p of s.projects.filter(p=>p.status==="active"&&s.month<p.last))add(a,"暂停长期工作","从下一执行月起暂停，释放可撤销的下一期预留；本期已付款不退还。",p.id);
  if(a.handler==="ACCEPT_SHORTFALL"&&routineDue(s)>0&&!s.facts.some(f=>f.id==="accept-shortfall-"+s.month))add(a,"确认经费短缺","接受实际未付义务及后果，不新增承诺、不免债。","current_month");
 }
 return base;
}
function quote(s,c,d){
 let ap=0,centimes=0,reason="";
 const end=d.actionId==="end_month";
 const a=c.actions.find(x=>x.id===d.actionId);
 if(s.phase==="required"){
  if(a?.handler!=="ACKNOWLEDGE"||d.proposalVersion!=="m"+s.month||!s.checkpoints.some(x=>x.id===d.targetId&&x.month===s.month&&!x.resolved))reason="必须先回应本月到期事项。";
  else if(!a.requires.every(k=>c.initial.actors.find(x=>x.kind==="player_central").capabilities.includes(k)))reason="无合法回应权限。";
 }
 else if(s.phase==="resume"&&!end)reason="当前仅可继续原月结算。";
 else if(s.phase!=="decision"&&s.phase!=="resume")reason="当前时段已经结束。";
 else if(end){if(d.targetId!=="current_month"||d.proposalVersion!=="m"+s.month)reason="推进目标已经失效。";}
 else if(!a)reason="该行动未接入或目标已经失效。";
 else{
  ap=a.ap;centimes=a.cost+(a.reserve_first_fee??0);
  const central=c.initial.actors.find(x=>x.kind==="player_central");
  if(!a.requires.every(k=>central.capabilities.includes(k)))reason="当前主体无权执行。";
  else if(a.handler==="CONTACT"){
   if(d.targetId!==a.target_actor_id||d.proposalVersion!=="v1")reason="目标已失效。";
   else if(s.contacts.some(x=>x.actionId===a.id))reason="相同方案已发出；当前无新的政治机会。";
   else if(s.contacts.filter(x=>x.issue===a.issue).length>=c.parameters.negotiation_max_exchanges)reason="本测试议题的有限方案已用尽。";
  }else if(d.proposalVersion!=="m"+s.month)reason="安排已失效。";
  else if(a.handler==="SCHEDULE_ORGANIZATION"||a.handler==="START_PROJECT"){
   if(d.targetId!=="current_month")reason="目标已失效。";
   else if(a.handler==="START_PROJECT"&&s.month+a.duration>=60)reason="计划执行期超出本局范围。";
   else if(queued(s).some(p=>p.actionId===a.id))reason="本月已有同类预约。";
  }else if(a.handler==="CANCEL_PENDING"){if(!queued(s).some(p=>p.id===d.targetId))reason="没有可撤销的预约。";}
  else if(a.handler==="PAUSE_PROJECT"){if(!s.projects.some(p=>p.id===d.targetId&&p.status==="active"&&s.month<p.last))reason="没有可暂停的未来工作。";}
  else if(a.handler==="ACCEPT_SHORTFALL"){if(d.targetId!=="current_month"||!routineDue(s)||s.facts.some(f=>f.id==="accept-shortfall-"+s.month))reason="没有待确认的经费短缺。";}
  else reason="该行动尚未接入。";
  if(!reason&&s.spent+reservedAP(s)+ap>2)reason="本月行动机会不足。";
  if(!reason&&centimes>available(s))reason="可用党资金不足。";
 }
 return {quoteId:canonical([RULES,s.month,d,ap,centimes,reason]),allowed:!reason,ap,centimes,reason:reason||"可提交；不保证对方接受。"};
}
function resolveContacts(s,c){
 for(const x of s.contacts.filter(x=>x.status==="sent")){
  const a=c.actions.find(a=>a.id===x.actionId);
  const actor=c.initial.actors.find(candidate=>candidate.id===a.target_actor_id);
  const response=actor.private_preference[a.variant];
  x.status=response==="wait"?"waiting":response==="accept"?"accepted":"rejected";
  x.responseMonth=s.month;
  if(response==="wait")addFact(s,x.id+"-reply","尚未获得正式回应",actor.name+"尚未就"+label(a.variant)+"作出正式答复。",s.month,"month_end");
  else addFact(s,x.id+"-reply",response==="accept"?"对方接受方案":"对方拒绝方案",actor.name+(response==="accept"?"接受":"拒绝")+"了"+label(a.variant)+"的磋商方案。"+(response==="accept"?"本记录仅代表对该方案的回应，不构成正式联盟或制度授权。":"已发生的接触费用不退还。"),s.month,"month_end");
 }
}
function settlePlans(s,c){
 for(const p of queued(s)){
  const a=c.actions.find(a=>a.id===p.actionId);
  const central=c.initial.actors.find(a=>a.kind==="player_central");
  if(!a.requires.every(k=>central.capabilities.includes(k))){p.status="failed";addFact(s,p.id+"-failed","预约失效","条件不再满足；释放未执行预留。",s.month,"month_end");continue;}
  p.status="executed";s.spent+=p.ap;
  if(p.kind==="organization"){transaction(s,p.id+"-fee",-p.amount,"organization",p.id);addFact(s,p.id+"-done","组织活动已执行","实际费用已支付，未虚构额外政治收益。",s.month,"month_end");}
  else{
   if(a.cost)transaction(s,p.id+"-fee",-a.cost,"project_start",p.id);
   s.projects.push({id:p.id,first:s.month+1,last:s.month+a.duration,fee:a.monthly_fee,reserve:a.reserve_first_fee,paid:[],progress:[],status:"active"});
   addFact(s,p.id+"-done","长期工作已启动","首期执行为下月；首期经费仍为预留，尚未支付。",s.month,"month_end");
  }
 }
 for(const p of s.projects){
  if(p.paid.includes(s.month)&&!p.progress.includes(s.month)){p.progress.push(s.month);addFact(s,p.id+"-progress-"+s.month,"长期工作月度执行","本月实际付款并登记执行月份，不代表确定的政治成果。",s.month,"month_end");}
  if(s.month>=p.last&&["active","paused"].includes(p.status)){p.reserve=0;p.status="completed";addFact(s,p.id+"-closed","长期工作计划期结束","已执行 "+p.progress.length+" 个月；未付费月份不计进展。",s.month,"month_end");}
 }
}
function apply(s,c,d,q){
 if(d.actionId==="end_month"){
  if(s.phase==="decision"){
   resolveContacts(s,c);
   const events=(c.initial.hard_checkpoints??[]).filter(x=>x.month===s.month);
   if(events.length){
    for(const e of events){
     const id="hard-"+e.id;
     s.checkpoints.push({id,month:e.month,day:e.day,title:e.title,description:e.description,resolved:false});
     addFact(s,id,e.title,e.description,s.month,"month_end");
    }
    s.phase="required";
    return "已到本月真实测试截止检查点；先回应全部到期事项，再继续原月结算。";
   }
  }
  settlePlans(s,c);
  if(s.sealed.includes(s.month))fail("duplicate seal");
  s.sealed.push(s.month);
  if(s.month===59){s.phase="ended";return "1938年12月已封存；没有第61个月。";}
  enter(s,c,s.month+1);return "本月已封存，进入"+monthLabel(s.month)+"。";
 }
 const a=c.actions.find(x=>x.id===d.actionId);
 if(a.handler==="ACKNOWLEDGE"){
  const x=s.checkpoints.find(x=>x.id===d.targetId);x.resolved=true;
  addFact(s,x.id+"-ack","已记录到期回应","不新增承诺；仅解决该项回应，保留实际已发生事实。",s.month,"month_end");
  if(!s.checkpoints.some(x=>x.month===s.month&&!x.resolved))s.phase="resume";
  return "已记录回应。";
 }
 if(a.handler==="SCHEDULE_ORGANIZATION"||a.handler==="START_PROJECT"){
  const id="plan-"+s.month+"-"+(s.plans.length+1);
  s.plans.push({id,actionId:a.id,month:s.month,kind:a.handler==="START_PROJECT"?"project":"organization",ap:q.ap,amount:q.centimes,status:"queued"});
  addFact(s,id,"已预约"+(a.handler==="START_PROJECT"?"长期工作":"组织活动"),"行动机会及资金已预留，尚未实际支付。");
  return "预约已确认；尚未实际支付。";
 }
 if(a.handler==="CANCEL_PENDING"){
  const p=s.plans.find(p=>p.id===d.targetId);p.status="cancelled";addFact(s,p.id+"-cancel","已撤销预约","未执行的行动及经费预留已释放。");return "预约已撤销。";
 }
 if(a.handler==="PAUSE_PROJECT"){
  const p=s.projects.find(p=>p.id===d.targetId);p.reserve=0;p.status="paused";reserveNext(s);addFact(s,p.id+"-pause-"+s.month,"已确认暂停长期工作","从下期起不再付费；保留当期已付款及实际执行记录。");return "下一期工作已暂停。";
 }
 if(a.handler==="ACCEPT_SHORTFALL"){addFact(s,"accept-shortfall-"+s.month,"已确认经费短缺","接受未付义务及后果；未免债、未支付、未新增承诺。");return "已记录未付义务；可继续推进。";}
 const id="contact-"+a.id;
 s.spent+=q.ap;
 transaction(s,id+"-fee",-q.centimes,"contact",id);
 s.contacts.push({id,actionId:a.id,issue:a.issue,month:s.month,status:"sent",responseMonth:null});
 addFact(s,id,"已发出"+label(a.variant)+"磋商", "已向目标主体发出接触，实际费用已结算，等待下一声明检查点。");
 return "接触已发出；费用已结算，等待对方回应。";
}
function validateState(s,c){
 if(!keys(s,["month","phase","entered","sealed","cash","spent","restricted","projectHold","checkpoints","ledger","obligations","contacts","plans","projects","facts","processed"]))fail("state shape");
 if(!integer(s.month,0,59)||!["decision","required","resume","ended"].includes(s.phase)||!integer(s.cash)||!integer(s.spent,0,2)||!integer(s.restricted,0,s.cash)||!integer(s.projectHold,0,s.cash))fail("state values");
 for(const k of ["entered","sealed","checkpoints","ledger","obligations","contacts","plans","projects","facts","processed"])if(!Array.isArray(s[k]))fail("array "+k);
 if(s.entered.length!==s.month+1||s.entered.some((m,i)=>m!==i)||s.sealed.length!==s.month+(s.phase==="ended"?1:0)||s.sealed.some((m,i)=>m!==i)||s.phase==="ended"&&s.month!==59)fail("clock");
 const unique=(a,k)=>{if(new Set(a.map(x=>x[k])).size!==a.length)fail("duplicate "+k)};
 unique(s.ledger,"id");unique(s.obligations,"id");unique(s.contacts,"id");unique(s.contacts,"actionId");unique(s.facts,"id");unique(s.processed,"requestId");
 const validMonth=m=>integer(m,0,s.month);
 unique(s.checkpoints,"id");
 for(const x of s.checkpoints){
  const e=(c.initial.hard_checkpoints??[]).find(e=>"hard-"+e.id===x.id);
  if(!keys(x,["id","month","day","title","description","resolved"])||!e||!validMonth(x.month)||x.month!==e.month||x.day!==e.day||x.title!==e.title||x.description!==e.description||typeof x.resolved!=="boolean"||!s.facts.some(f=>f.id===x.id&&f.month===x.month)||x.resolved!==s.facts.some(f=>f.id===x.id+"-ack"&&f.month===x.month))fail("checkpoint");
  if(x.month<s.month&&!x.resolved||s.sealed.includes(x.month)&&!x.resolved)fail("unresolved sealed checkpoint");
 }
 for(const e of c.initial.hard_checkpoints??[]){if((s.sealed.includes(e.month)||e.month===s.month&&["required","resume"].includes(s.phase))!==s.checkpoints.some(x=>x.id==="hard-"+e.id))fail("checkpoint coverage");}
 const here=s.checkpoints.filter(x=>x.month===s.month);
 if(s.phase==="required"&&(!here.length||!here.some(x=>!x.resolved))||s.phase==="resume"&&(!here.length||here.some(x=>!x.resolved))||s.phase==="decision"&&here.length)fail("checkpoint cursor");
 let balance=c.initial.party_cash;
 for(const t of s.ledger){if(!keys(t,["id","month","delta","kind","ref"])||!safeId(t.id)||!safeId(t.ref)||!validMonth(t.month)||!Number.isSafeInteger(t.delta)||!["income","routine","contact","organization","project_start","project_month"].includes(t.kind))fail("ledger row");balance+=t.delta;if(!integer(balance))fail("ledger balance");}
 if(balance!==s.cash)fail("cash");
 for(const m of s.entered){const inc=s.ledger.filter(t=>t.kind==="income"&&t.month===m);if(c.parameters.monthly_income?(inc.length!==1||inc[0].id!=="income-"+m||inc[0].delta!==c.parameters.monthly_income):inc.length!==0)fail("income");}
 for(const o of s.obligations){if(!keys(o,["id","month","amount","paid"])||!validMonth(o.month)||o.id!=="routine-"+o.month||o.amount!==c.parameters.monthly_routine_due||typeof o.paid!=="boolean")fail("obligation");const pay=s.ledger.filter(t=>t.kind==="routine"&&t.ref===o.id);if(o.paid?(pay.length!==1||pay[0].id!=="pay-"+o.id||pay[0].delta!==-o.amount||pay[0].month<o.month):pay.length)fail("payment");}
 if(s.obligations.length!==(c.parameters.monthly_routine_due?s.entered.length:0)||s.ledger.some(t=>t.kind==="routine"&&!s.obligations.some(o=>o.id===t.ref)))fail("routine coverage");
 const unpaid=s.obligations.filter(o=>!o.paid).reduce((n,o)=>n+o.amount,0);if(!integer(unpaid)||s.restricted!==Math.min(s.cash-reservedMoney(s),unpaid)||!integer(available(s)))fail("restriction");
 for(const f of s.facts)if(!keys(f,["id","title","description","month","slot"])||!safeId(f.id)||!validMonth(f.month)||typeof f.title!=="string"||typeof f.description!=="string"||!["opening","decision","month_end"].includes(f.slot))fail("fact");
 for(const f of c.initial.facts)if(!s.facts.some(x=>x.id===f.id&&x.description===f.text&&x.month===0))fail("initial fact");
 let spent=0;
 for(const issue of c.initial.issues)if(s.contacts.filter(x=>x.issue===issue.id).length>c.parameters.negotiation_max_exchanges)fail("negotiation limit");
 for(const x of s.contacts){
  const a=c.actions.find(a=>a.id===x.actionId&&a.handler==="CONTACT");
  if(!keys(x,["id","actionId","issue","month","status","responseMonth"])||!a||x.id!=="contact-"+a.id||x.issue!==a.issue||!validMonth(x.month)||!["sent","accepted","rejected","waiting"].includes(x.status))fail("contact");
  const fee=s.ledger.filter(t=>t.kind==="contact"&&t.ref===x.id);if(fee.length!==1||fee[0].delta!==-a.cost||fee[0].id!==x.id+"-fee"||fee[0].month!==x.month)fail("contact fee");
  const sent=s.facts.find(f=>f.id===x.id),reply=s.facts.find(f=>f.id===x.id+"-reply");if(!sent||sent.month!==x.month)fail("contact fact");
  if(x.status==="sent"){if(x.responseMonth!==null||reply||s.sealed.includes(x.month)||x.month===s.month&&["required","resume"].includes(s.phase))fail("pending reply");}
  else if(x.responseMonth!==x.month||(!s.sealed.includes(x.month)&&!(x.month===s.month&&["required","resume"].includes(s.phase)))||!reply||reply.month!==x.responseMonth)fail("reply fact");
  if(x.month===s.month)spent+=a.ap;
 }
 unique(s.plans,"id");unique(s.projects,"id");
 for(const p of s.plans){
  const a=c.actions.find(a=>a.id===p.actionId);
  if(!keys(p,["id","actionId","month","kind","ap","amount","status"])||!a||!validMonth(p.month)||!safeId(p.id)||!["queued","executed","cancelled","failed"].includes(p.status)||!["project","organization"].includes(p.kind)||p.kind!==(a.handler==="START_PROJECT"?"project":"organization")||!["START_PROJECT","SCHEDULE_ORGANIZATION"].includes(a.handler)||p.ap!==a.ap||p.amount!==a.cost+(a.reserve_first_fee??0))fail("plan");
  if(p.status==="queued"&&(p.month!==s.month||s.sealed.includes(p.month)))fail("pending plan");
  if(p.status==="executed"&&!s.sealed.includes(p.month))fail("plan execution date");
  const fees=s.ledger.filter(t=>["organization","project_start"].includes(t.kind)&&t.ref===p.id);
  const expected=p.status==="executed"?(p.kind==="organization"||a.cost>0?1:0):0;
  if(fees.length!==expected||fees.some(t=>t.id!==p.id+"-fee"||t.month!==p.month||t.delta!==-a.cost||t.kind!==(p.kind==="organization"?"organization":"project_start")))fail("plan fee");
  if((p.status==="executed"&&p.kind==="project")!==s.projects.some(x=>x.id===p.id))fail("project reference");
  if(p.status==="executed"&&p.month===s.month)spent+=p.ap;
 }
 for(const p of s.projects){
  const plan=s.plans.find(x=>x.id===p.id),a=c.actions.find(a=>a.id===plan?.actionId);
  if(!keys(p,["id","first","last","fee","reserve","paid","progress","status"])||!plan||plan.status!=="executed"||plan.kind!=="project"||p.first!==plan.month+1||p.last!==plan.month+a.duration||p.last>59||p.fee!==a.monthly_fee||!integer(p.reserve,0,p.fee)||!Array.isArray(p.paid)||!Array.isArray(p.progress)||!["active","paused","completed"].includes(p.status))fail("project");
  if(p.status!=="active"&&p.reserve!==0||p.status==="active"&&s.month>=p.last&&p.reserve!==0||p.status==="completed"&&(!s.sealed.includes(p.last)))fail("project status");
  if(new Set(p.paid).size!==p.paid.length||new Set(p.progress).size!==p.progress.length||p.paid.some(m=>!integer(m,p.first,Math.min(s.month,p.last)))||p.progress.some(m=>!p.paid.includes(m)||!s.sealed.includes(m))||p.paid.some(m=>s.sealed.includes(m)&&!p.progress.includes(m)))fail("project progress");
  const fees=s.ledger.filter(t=>t.kind==="project_month"&&t.ref===p.id);
  if(fees.length!==p.paid.length||fees.some(t=>t.delta!==-p.fee||t.id!==p.id+"-fee-"+t.month||!p.paid.includes(t.month)))fail("project payment");
 }
 if(s.projectHold>0){const next=s.projects.filter(p=>p.status==="active"&&s.month<p.last);const demand=next.reduce((n,p)=>n+p.fee,0);if(next.length<2||next.some(p=>p.reserve!==0)||demand<=s.projectHold||available(s)!==0)fail("project conflict pool");}
 if(s.ledger.some(t=>["organization","project_start"].includes(t.kind)&&!s.plans.some(p=>p.id===t.ref)||t.kind==="project_month"&&!s.projects.some(p=>p.id===t.ref)))fail("orphan project ledger");
 if(s.ledger.some(t=>t.kind==="contact"&&!s.contacts.some(x=>x.id===t.ref))||spent+reservedAP(s)>2||s.spent!==spent)fail("action budget");
 for(const p of s.processed){if(!keys(p,["requestId","canonical","status","message","month"])||!safeId(p.requestId)||typeof p.canonical!=="string"||!["committed","rejected"].includes(p.status)||typeof p.message!=="string"||!validMonth(p.month))fail("processed");let payload=JSON.parse(p.canonical);if(!validCommand({requestId:p.requestId,...payload}))fail("processed payload");}
 const committed=s.processed.filter(p=>p.status==="committed").map(p=>JSON.parse(p.canonical).draft);
 if(committed.filter(d=>d.actionId==="end_month").length!==s.sealed.length+new Set(s.checkpoints.map(x=>x.month)).size||committed.filter(d=>d.actionId==="acknowledge_no_commitment").length!==s.checkpoints.filter(x=>x.resolved).length||committed.filter(d=>c.actions.some(a=>a.id===d.actionId&&a.handler==="CONTACT")).length!==s.contacts.length||committed.filter(d=>c.actions.some(a=>a.id===d.actionId&&["START_PROJECT","SCHEDULE_ORGANIZATION"].includes(a.handler))).length!==s.plans.length)fail("processed commit count");
}
export function createCoreSession(rawConfig){
 const c=loadF1(rawConfig),configIdentity=checksum(canonical(c));
 let s=initial(c);validateState(s,c);
 const view=()=>snapshot(s,c);
 const result=(id,status,message)=>({requestId:id,status,message,snapshot:view()});
 function dispatch(cmd){
  if(!validCommand(cmd))return result("invalid","rejected","请求格式无效。");
  const payload=canonical({draft:cmd.draft,confirmedQuote:cmd.confirmedQuote});
  const prior=s.processed.find(x=>x.requestId===cmd.requestId);
  if(prior)return prior.canonical===payload?result(cmd.requestId,prior.status,prior.message):result(cmd.requestId,"rejected","请求标识冲突。");
  if(s.processed.length>=4096)return result(cmd.requestId,"rejected","测试会话请求容量已达上限。");
  const actual=quote(s,c,cmd.draft),next=copy(s);
  let status="rejected",message=actual.reason;
  try{
   if(canonical(cmd.confirmedQuote)!==canonical(actual))message="当前条件或费用已变化，请重新确认。";
   else if(actual.allowed){message=apply(next,c,cmd.draft,actual);status="committed";}
   next.processed.push({requestId:cmd.requestId,canonical:payload,status,message,month:s.month});
   validateState(next,c);s=next;return result(cmd.requestId,status,message);
  }catch{return result(cmd.requestId,"rejected","技术执行失败；未提交本次请求。");}
 }
 function archive(q){
  const page=integer(q?.page,1,10000)?q.page:1,size=integer(q?.pageSize,1,100)?q.pageSize:20,term=typeof q?.text==="string"?q.text.trim().slice(0,256):"";
  const all=s.facts.filter(f=>(q?.monthIndex===undefined||f.month===q.monthIndex)&&(!term||f.title.includes(term)||f.description.includes(term))).slice().reverse();
  return {items:all.slice((page-1)*size,page*size).map(f=>({id:f.id,title:f.title,knownAt:monthLabel(f.month)})),total:all.length,page};
 }
 return {
  getSnapshot:view,
  listActions:()=>choices(s,c).map(a=>({...a,quote:quote(s,c,a.draft)})),
  queryArchive:archive,
  queryWork:()=>[...s.contacts.filter(x=>x.status==="sent"||x.status==="waiting").map(x=>({id:x.status==="waiting"?x.id+"-reply":x.id,title:"等待"+label(c.actions.find(a=>a.id===x.actionId).variant)+"回应",knownAt:monthLabel(x.responseMonth??x.month)})),...queued(s).map(p=>({id:p.id,title:p.kind==="project"?"待启动长期工作":"待执行组织活动",knownAt:monthLabel(p.month)})),...s.projects.filter(p=>["active","paused"].includes(p.status)).map(p=>({id:p.id+"-done",title:"长期工作 · "+(p.status==="paused"?"已暂停":"执行中")+" · "+p.progress.length+" / "+(p.last-p.first+1)+"月",knownAt:monthLabel(p.first)}))],
  queryDetail:id=>{const f=s.facts.find(f=>f.id===id);return f?{id:f.id,title:f.title,description:f.description}:null},
  previewQuote:d=>validDraft(d)?quote(s,c,d):{quoteId:"invalid",allowed:false,ap:0,centimes:0,reason:"方案无效。"},
  dispatch,
  exportSave:()=>{const body={format:FORMAT,rules:RULES,profile:c.profile_id,configIdentity,state:copy(s)};return JSON.stringify({body,checksum:checksum(canonical(body))});},
  importSave:raw=>{
   try{if(typeof raw!=="string"||raw.length>2097152)fail("save size");const parsed=JSON.parse(raw);if(!keys(parsed,["body","checksum"])||!keys(parsed.body,["format","rules","profile","configIdentity","state"]))fail("save envelope");
    const b=parsed.body;if(b.format!==FORMAT||b.rules!==RULES||b.profile!==c.profile_id||b.configIdentity!==configIdentity||parsed.checksum!==checksum(canonical(b)))fail("save version or checksum");
    validateState(b.state,c);s=copy(b.state);return {ok:true,message:"导入成功。"};
   }catch{return {ok:false,message:"存档无效或不兼容；保留当前会话。"};}
  }
 };
}

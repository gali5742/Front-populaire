// G2-B: deliberately limited F1 vertical slice. All state private to the session.
import {loadF1} from "../config/f1-schema.mjs";
const RULES="g2-b-1", FORMAT="front-populaire-save-1";
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
function enter(s,c,m){
 if(m<0||m>=60||s.entered.includes(m))fail("entry invariant");
 s.month=m;s.entered.push(m);s.spent=0;s.phase="decision";
 if(c.parameters.monthly_income)transaction(s,"income-"+m,c.parameters.monthly_income,"income","monthly-income");
 const due=c.parameters.monthly_routine_due;
 if(due)s.obligations.push({id:"routine-"+m,month:m,amount:due,paid:false});
 const unpaid=s.obligations.filter(x=>!x.paid),total=unpaid.reduce((a,x)=>a+x.amount,0);
 if(!integer(total))fail("obligation overflow");
 // Only identical routine liabilities in B. No partial allocation or order-based preference.
 if(total<=s.cash){for(const o of unpaid){transaction(s,"pay-"+o.id,-o.amount,"routine",o.id);o.paid=true;}s.restricted=0;}
 else{s.restricted=s.cash;addFact(s,"shortfall-"+m,"例行经费短缺","到期例行费用未获足额保障；保留实际未付义务和受限资金，不自动分配。",m,"opening");}
}
function initial(c){
 const s={month:0,phase:"entry",entered:[],sealed:[],cash:c.initial.party_cash,spent:0,restricted:0,ledger:[],obligations:[],contacts:[],facts:c.initial.facts.map(f=>({id:f.id,title:"公开政治表态",description:f.text,month:0,slot:"opening"})),processed:[]};
 enter(s,c,0);return s;
}
function snapshot(s,c){
 return {time:{monthIndex:s.month,label:monthLabel(s.month),phase:s.phase},identity:c.initial.actors.find(a=>a.kind==="player_central").name,actionRemaining:s.phase==="ended"?0:2-s.spent,partyAvailableCentimes:s.cash-s.restricted,partyCashCentimes:s.cash,restrictedCentimes:s.restricted,requiredBlock:false,workCount:s.contacts.filter(x=>x.status==="sent"||x.status==="waiting").length,briefCount:s.facts.filter(f=>f.month===s.month).length,profileLabel:c.display_label};
}
function choices(s,c){
 return c.actions.filter(a=>a.handler==="CONTACT").map(a=>({id:a.id,title:"就"+label(a.variant)+"发起磋商",description:"与"+c.initial.actors.find(x=>x.id===a.target_actor_id).name+"联系；对方将于下一声明检查点自主回应。",draft:{actionId:a.id,targetId:a.target_actor_id,proposalVersion:"v1"}}));
}
function quote(s,c,d){
 let ap=0,centimes=0,reason="";
 const end=d.actionId==="end_month";
 const a=c.actions.find(x=>x.id===d.actionId&&x.handler==="CONTACT");
 if(s.phase!=="decision")reason="当前时段已经结束。";
 else if(end){if(d.targetId!=="current_month"||d.proposalVersion!=="m"+s.month)reason="推进目标已经失效。";}
 else if(!a||d.targetId!==a.target_actor_id||d.proposalVersion!=="v1")reason="该行动未接入或目标已经失效。";
 else{
  ap=a.ap;centimes=a.cost;
  const central=c.initial.actors.find(x=>x.kind==="player_central");
  if(!a.requires.every(k=>central.capabilities.includes(k)))reason="当前主体无权执行。";
  else if(s.contacts.some(x=>x.actionId===a.id))reason="相同方案已发出；当前无新的政治机会。";
  else if(s.contacts.filter(x=>x.issue===a.issue).length>=c.parameters.negotiation_max_exchanges)reason="本测试议题的有限方案已用尽。";
  else if(s.spent+ap>2)reason="本月行动机会不足。";
  else if(centimes>s.cash-s.restricted)reason="可用党资金不足。";
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
function apply(s,c,d,q){
 if(d.actionId==="end_month"){
  resolveContacts(s,c);
  if(s.sealed.includes(s.month))fail("duplicate seal");
  s.sealed.push(s.month);
  if(s.month===59){s.phase="ended";return "1938年12月已封存；没有第61个月。";}
  enter(s,c,s.month+1);return "本月已封存，进入"+monthLabel(s.month)+"。";
 }
 const a=c.actions.find(x=>x.id===d.actionId);
 const id="contact-"+a.id;
 s.spent+=q.ap;
 transaction(s,id+"-fee",-q.centimes,"contact",id);
 s.contacts.push({id,actionId:a.id,issue:a.issue,month:s.month,status:"sent",responseMonth:null});
 addFact(s,id,"已发出"+label(a.variant)+"磋商", "已向目标主体发出接触，实际费用已结算，等待下一声明检查点。");
 return "接触已发出；费用已结算，等待对方回应。";
}
function validateState(s,c){
 if(!keys(s,["month","phase","entered","sealed","cash","spent","restricted","ledger","obligations","contacts","facts","processed"]))fail("state shape");
 if(!integer(s.month,0,59)||!["decision","ended"].includes(s.phase)||!integer(s.cash)||!integer(s.spent,0,2)||!integer(s.restricted,0,s.cash))fail("state values");
 for(const k of ["entered","sealed","ledger","obligations","contacts","facts","processed"])if(!Array.isArray(s[k]))fail("array "+k);
 if(s.entered.length!==s.month+1||s.entered.some((m,i)=>m!==i)||s.sealed.length!==s.month+(s.phase==="ended"?1:0)||s.sealed.some((m,i)=>m!==i)||s.phase==="ended"&&s.month!==59)fail("clock");
 const unique=(a,k)=>{if(new Set(a.map(x=>x[k])).size!==a.length)fail("duplicate "+k)};
 unique(s.ledger,"id");unique(s.obligations,"id");unique(s.contacts,"id");unique(s.contacts,"actionId");unique(s.facts,"id");unique(s.processed,"requestId");
 const validMonth=m=>integer(m,0,s.month);
 let balance=c.initial.party_cash;
 for(const t of s.ledger){if(!keys(t,["id","month","delta","kind","ref"])||!safeId(t.id)||!safeId(t.ref)||!validMonth(t.month)||!Number.isSafeInteger(t.delta)||!["income","routine","contact"].includes(t.kind))fail("ledger row");balance+=t.delta;if(!integer(balance))fail("ledger balance");}
 if(balance!==s.cash)fail("cash");
 for(const m of s.entered){const inc=s.ledger.filter(t=>t.kind==="income"&&t.month===m);if(c.parameters.monthly_income?(inc.length!==1||inc[0].id!=="income-"+m||inc[0].delta!==c.parameters.monthly_income):inc.length!==0)fail("income");}
 for(const o of s.obligations){if(!keys(o,["id","month","amount","paid"])||!validMonth(o.month)||o.id!=="routine-"+o.month||o.amount!==c.parameters.monthly_routine_due||typeof o.paid!=="boolean")fail("obligation");const pay=s.ledger.filter(t=>t.kind==="routine"&&t.ref===o.id);if(o.paid?(pay.length!==1||pay[0].id!=="pay-"+o.id||pay[0].delta!==-o.amount||pay[0].month<o.month):pay.length)fail("payment");}
 if(s.obligations.length!==(c.parameters.monthly_routine_due?s.entered.length:0)||s.ledger.some(t=>t.kind==="routine"&&!s.obligations.some(o=>o.id===t.ref)))fail("routine coverage");
 const unpaid=s.obligations.filter(o=>!o.paid).reduce((n,o)=>n+o.amount,0);if(!integer(unpaid)||s.restricted!==(unpaid?s.cash:0))fail("restriction");
 for(const f of s.facts)if(!keys(f,["id","title","description","month","slot"])||!safeId(f.id)||!validMonth(f.month)||typeof f.title!=="string"||typeof f.description!=="string"||!["opening","decision","month_end"].includes(f.slot))fail("fact");
 for(const f of c.initial.facts)if(!s.facts.some(x=>x.id===f.id&&x.description===f.text&&x.month===0))fail("initial fact");
 let spent=0;
 for(const x of s.contacts){
  const a=c.actions.find(a=>a.id===x.actionId&&a.handler==="CONTACT");
  if(!keys(x,["id","actionId","issue","month","status","responseMonth"])||!a||x.id!=="contact-"+a.id||x.issue!==a.issue||!validMonth(x.month)||!["sent","accepted","rejected","waiting"].includes(x.status))fail("contact");
  const fee=s.ledger.filter(t=>t.kind==="contact"&&t.ref===x.id);if(fee.length!==1||fee[0].delta!==-a.cost||fee[0].id!==x.id+"-fee"||fee[0].month!==x.month)fail("contact fee");
  const sent=s.facts.find(f=>f.id===x.id),reply=s.facts.find(f=>f.id===x.id+"-reply");if(!sent||sent.month!==x.month)fail("contact fact");
  if(x.status==="sent"){if(x.responseMonth!==null||reply||s.sealed.includes(x.month))fail("pending reply");}
  else if(x.responseMonth!==x.month||!s.sealed.includes(x.month)||!reply||reply.month!==x.responseMonth)fail("reply fact");
  if(x.month===s.month)spent+=a.ap;
 }
 if(s.ledger.some(t=>t.kind==="contact"&&!s.contacts.some(x=>x.id===t.ref))||spent>2||s.spent!==spent)fail("action budget");
 for(const p of s.processed){if(!keys(p,["requestId","canonical","status","message","month"])||!safeId(p.requestId)||typeof p.canonical!=="string"||!["committed","rejected"].includes(p.status)||typeof p.message!=="string"||!validMonth(p.month))fail("processed");let payload=JSON.parse(p.canonical);if(!validCommand({requestId:p.requestId,...payload}))fail("processed payload");}
 if(s.processed.filter(p=>p.status==="committed").length!==s.contacts.length+s.sealed.length)fail("processed commit count");
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
  const all=s.facts.filter(f=>!term||f.title.includes(term)||f.description.includes(term)).slice().reverse();
  return {items:all.slice((page-1)*size,page*size).map(f=>({id:f.id,title:f.title,knownAt:monthLabel(f.month)})),total:all.length,page};
 }
 return {
  getSnapshot:view,
  listActions:()=>choices(s,c).map(a=>({...a,quote:quote(s,c,a.draft)})),
  queryArchive:archive,
  queryWork:()=>s.contacts.filter(x=>x.status==="sent"||x.status==="waiting").map(x=>({id:x.status==="waiting"?x.id+"-reply":x.id,title:"等待"+label(c.actions.find(a=>a.id===x.actionId).variant)+"回应",knownAt:monthLabel(x.responseMonth??x.month)})),
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

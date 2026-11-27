import {useState,useRef,useEffect} from "react";
import {createRoot} from "react-dom/client";
import type {ActionDraft,QuoteView,RecordSummary} from "../contracts/session";
import {gameSession as session} from "./game-session";
import "./main.css";
const money=(n:number)=>new Intl.NumberFormat("zh-CN",{maximumFractionDigits:2}).format(n/100)+" F";
const requestId=()=>Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,"0")).join("");
type Modal={kind:"confirm";draft:ActionDraft;quote:QuoteView;title:string;requestId:string}|{kind:"detail";id:string}|{kind:"settings"};
function App(){
 const [snap,setSnap]=useState(()=>session.getSnapshot());
 const [nav,setNav]=useState<"action"|"archive">("action");
 const [filter,setFilter]=useState("");
 const [page,setPage]=useState(1);
 const [drawer,setDrawer]=useState(true);
 const [modal,setModal]=useState<Modal|null>(null);
 const [feedback,setFeedback]=useState("");
 const [busy,setBusy]=useState(false);
 const locked=useRef(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=dialog.current;if(modal&&d&&!d.open)d.showModal();else if(!modal&&d?.open)d.close();},[modal]);
 const records=session.queryArchive({text:filter,page,pageSize:12});
 const recent=session.queryArchive({text:"",page:1,pageSize:4});
 const actions=session.listActions();
 const work=session.queryWork();
 const detail=modal?.kind==="detail"?session.queryDetail(modal.id):null;
 function openConfirm(title:string,draft:ActionDraft){setFeedback("");setModal({kind:"confirm",draft,quote:session.previewQuote(draft),title,requestId:requestId()});}
 function confirm(){
  if(modal?.kind!=="confirm"||locked.current||!modal.quote.allowed)return;
  locked.current=true;try{const result=session.dispatch({requestId:modal.requestId,draft:modal.draft,confirmedQuote:modal.quote});setSnap(result.snapshot);setFeedback(result.message);setModal(null);}finally{locked.current=false;}
 }
 function exportFile(){const url=URL.createObjectURL(new Blob([session.exportSave()],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="front-populaire-f1.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const recordList=(items:readonly RecordSummary[])=>items.length?<ul className="records">{items.map(f=><li key={f.id}><span>{f.title}<small>{f.knownAt}</small></span><button className="link" onClick={()=>setModal({kind:"detail",id:f.id})}>查看详情 &gt;</button></li>)}</ul>:<p className="muted">没有符合条件的记录。</p>;
 return <div className="shell">
  <header className="header"><div className="mast"><div><strong>人民阵线</strong><span className="subtitle">法国社会党政治模拟</span></div><nav aria-label="主导航"><button className={nav==="action"?"selected":""} onClick={()=>setNav("action")}>行动</button><button disabled title="G3尚未接入">党务</button><button disabled title="G3–G5尚未接入">政治</button><button className={nav==="archive"?"selected":""} onClick={()=>setNav("archive")}>档案</button></nav><button className="link" onClick={()=>setModal({kind:"settings"})}>设置</button></div>
  <div className="resources"><b>{snap.time.label}</b><span>{snap.identity}</span><span>党员 — <small>未加载</small></span><span>众议院 — <small>未加载</small></span><span>党资金 <b aria-label="可用党资金">{money(snap.partyAvailableCentimes)}</b></span></div></header>
  <div className="test-label">{snap.profileLabel} · G2-B 核心切片　|　未接入完整历史开局与政治制度</div>
  <main className={drawer?"layout":"layout collapsed"}><section className="main-panel">
   {nav==="action"?<><h1>{snap.time.phase==="ended"?"政治总结":"本月工作"}</h1>
    <section className="section"><h2>局势简报</h2>{recordList(recent.items)}</section>
    <section className="section"><h2>可采取的行动</h2>
     {snap.time.phase==="ended"?<p>1938年12月已封存。可继续查阅本局档案或导出存档。</p>:actions.map(a=><article className="action" key={a.id}><div><h3>{a.title}</h3><p>{a.description}</p><small>消耗：{a.quote.ap}次行动 · {money(a.quote.centimes)}</small>{!a.quote.allowed&&<p className="muted">{a.quote.reason}</p>}</div><button onClick={()=>openConfirm(a.title,a.draft)}>查看方案 &gt;</button></article>)}
     <p className="muted">组织活动、长期工作及必答处置在后续批次接入；当前不提供虚假行动入口。</p>
    </section></>:<><h1>档案</h1><div className="subnav"><b>本局记录</b><span className="muted">历史资料（未接入）</span></div><section className="section"><h2>本局行动与政治记录</h2><label>搜索记录 <input value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}} placeholder="标题或正文"/></label><p className="muted">共 {records.total} 条可知记录</p>{recordList(records.items)}<div className="pager"><button disabled={page<=1} onClick={()=>setPage(n=>n-1)}>上一页</button><span>第 {page} 页</span><button disabled={page*12>=records.total} onClick={()=>setPage(n=>n+1)}>下一页</button></div></section></>}
  </section>{drawer&&<aside className="side"><h2>局势与工作 <button className="link" onClick={()=>setDrawer(false)}>收起</button></h2><section><h3>待回应工作（{snap.workCount}）</h3>{work.length?recordList(work):<p className="muted">当前无待回应工作。</p>}</section><section><h3>党资金</h3><dl><dt>账面</dt><dd>{money(snap.partyCashCentimes)}</dd><dt>受限</dt><dd>{money(snap.restrictedCentimes)}</dd><dt>可用</dt><dd>{money(snap.partyAvailableCentimes)}</dd></dl></section></aside>}</main>
  <footer><div><button className="link" onClick={()=>setDrawer(!drawer)}>工作项目（{snap.workCount}）</button><button className="link" onClick={()=>setNav("archive")}>本月记录（{snap.briefCount}）</button></div><span aria-label="剩余行动">仍有 {snap.actionRemaining} 次行动可用</span><button className="primary" disabled={snap.time.phase==="ended"} onClick={()=>openConfirm("结束本月",{actionId:"end_month",targetId:"current_month",proposalVersion:"m"+snap.time.monthIndex})}>结束本月 →</button></footer>
  <div role="status" aria-label="操作反馈" className="feedback">{feedback}</div>
  <dialog ref={dialog} onCancel={e=>{e.preventDefault();if(!busy)setModal(null);}} aria-label={modal?.kind==="confirm"?modal.title:modal?.kind==="settings"?"设置":"记录详情"}><div className="dialog-body">
  {modal?.kind==="confirm"?<><h2>{modal.title}</h2><p>{modal.draft.actionId==="end_month"?"按实际检查点结算待回应事务，再封存本月。未使用的行动机会不结转。":actions.find(x=>x.id===modal.draft.actionId)?.description}</p><p>消耗：{modal.quote.ap}次行动 · {money(modal.quote.centimes)}</p><p>{modal.quote.reason}</p><div className="dialog-actions"><button onClick={()=>setModal(null)}>返回</button><button className="primary" disabled={!modal.quote.allowed} onClick={confirm}>确认提交</button></div></>:modal?.kind==="settings"?<><h2>设置与存档</h2><p>手动导入、导出；此切片未启用自动存档。</p><button onClick={exportFile}>导出存档</button><p><label>导入存档 <input type="file" disabled={busy} accept=".json,application/json" onChange={async e=>{const input=e.currentTarget,f=input.files?.[0];if(!f||locked.current)return;locked.current=true;setBusy(true);try{const outcome=f.size>2097152?{ok:false,message:"存档过大；保留当前会话。"}:session.importSave(await f.text());setFeedback(outcome.message);if(outcome.ok){setSnap(session.getSnapshot());setModal(null);setPage(1);}}catch{setFeedback("读取失败；保留当前会话。");}finally{input.value="";locked.current=false;setBusy(false);}}}/></label></p><p role="status" aria-label="存档反馈">{feedback}</p><div className="dialog-actions"><button disabled={busy} onClick={()=>setModal(null)}>关闭</button></div></>:<><h2>{detail?.title??"记录不可用"}</h2><p>{detail?.description??"当前没有可查阅的记录。"}</p><div className="dialog-actions"><button onClick={()=>setModal(null)}>关闭</button></div></>}
  </div></dialog>
 </div>
}
createRoot(document.getElementById("root")!).render(<App/>);

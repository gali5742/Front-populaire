import {useState} from "react";
import {createRoot} from "react-dom/client";
import "./probe.css";
import {readProbe,writeProbe} from "../engine/persistence/probe-save";
function Probe(){
 const [count,setCount]=useState(0);
 const [message,setMessage]=useState("");
 function exportFile(){
  const url=URL.createObjectURL(new Blob([writeProbe(count)],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="front-probe.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <main><header>人民阵线　｜　G2-A 工程试验</header><p>仅验证工具链、离线启动和文本存档，不包含政治模拟。</p><p>测试计数：<output aria-label="测试计数">{count}</output></p><button onClick={()=>setCount(v=>v+1)}>测试交互</button> <button onClick={exportFile}>导出试验存档</button><p><label>导入试验存档 <input type="file" accept=".json,application/json" onChange={async e=>{const input=e.currentTarget;const file=input.files?.[0];if(!file)return;try{if(file.size>65536)throw Error("文件过大");const next=readProbe(await file.text());setCount(next);setMessage("导入成功");}catch{setMessage("导入失败；保留当前试验状态");}finally{input.value="";}}}/></label></p><p role="status">{message}</p></main>;
}
createRoot(document.getElementById("root")!).render(<Probe/>);

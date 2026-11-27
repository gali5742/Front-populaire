// A separate classic script bundle. Reject residual assets/chunks instead of silently omitting them.
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
const result=await build({configFile:false,esbuild:{jsx:"automatic"},build:{target:"es2022",write:false,cssCodeSplit:false,lib:{entry:"src/app/probe.tsx",name:"FrontPopulaireProbe",formats:["iife"],fileName:"probe"},rollupOptions:{output:{inlineDynamicImports:true}}}});
const outputs=(Array.isArray(result)?result:[result]).flatMap(x=>x.output??[]);
const chunks=outputs.filter(x=>x.type==="chunk");
if(chunks.length!==1||chunks[0].imports.length||chunks[0].dynamicImports.length)throw Error("expected one self-contained classic chunk");
const styles=outputs.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css"));
if(outputs.some(x=>x.type==="asset"&&!x.fileName.endsWith(".css")))throw Error("unexpected external asset");
const js=chunks[0].code.replace(/<\/script/gi,"<\\/script");
const css=styles.map(x=>typeof x.source==="string"?x.source:new TextDecoder().decode(x.source)).join("\n");
if(/<\/style/i.test(css))throw Error("unsafe inline stylesheet");
const html='<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>人民阵线 · 工程试验</title><style>'+css+'</style></head><body><div id="root"></div><script>'+js+'</script></body></html>';
await mkdir("dist-offline",{recursive:true});await writeFile("dist-offline/front-probe.html",html);

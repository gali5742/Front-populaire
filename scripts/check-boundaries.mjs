import ts from "typescript";
import {readdirSync,readFileSync,existsSync,statSync,realpathSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,relative,sep} from "node:path";
import {role,allowedImport,normalizedImport} from "./lib/boundaries.mjs";
const root=realpathSync(fileURLToPath(new URL("../",import.meta.url)));
const posix=p=>p.split(sep).join("/");
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>{const x=resolve(p,e.name);if(e.isSymbolicLink())throw Error("source symlink not allowed: "+x);return e.isDirectory()?walk(x):/\.(?:[cm]?[jt]s|[jt]sx)$/.test(e.name)?[x]:[]});
export function inspectSource(path,source){
 const violations=[];
 const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,path.endsWith(".tsx")?ts.ScriptKind.TSX:path.endsWith(".jsx")?ts.ScriptKind.JSX:/\.m?js$/.test(path)?ts.ScriptKind.JS:ts.ScriptKind.TS);
 const emit=(node,msg)=>violations.push(path+":"+(sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1)+": "+msg);
 const check=(node,expr)=>{
  if(!expr||!ts.isStringLiteralLike(expr)){emit(node,"computed module reference forbidden");return;}
  const spec=expr.text;if(!allowedImport(path,spec))emit(node,"dependency denied: "+spec);
  if(spec.startsWith(".")){const target=normalizedImport(path,spec);if(!target||!["",".ts",".tsx",".mjs",".js",".json",".css","/index.ts","/index.tsx","/index.mjs"].some(ext=>{const p=resolve(root,target+ext);return existsSync(p)&&statSync(p).isFile()&&posix(relative(root,realpathSync(p))).startsWith("src/")}))emit(node,"unresolved or external relative dependency: "+spec);}
 };
 const visit=n=>{
  if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)){if(n.moduleSpecifier)check(n,n.moduleSpecifier);}
  else if(ts.isImportEqualsDeclaration(n)){if(ts.isExternalModuleReference(n.moduleReference))check(n,n.moduleReference.expression);}
  else if(ts.isImportTypeNode(n)){if(ts.isLiteralTypeNode(n.argument))check(n,n.argument.literal);else emit(n,"computed import type");}
  else if(ts.isCallExpression(n)){
   if(n.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(n.expression)&&n.expression.text==="require")check(n,n.arguments[0]);
   if(role(path)==="ui"&&ts.isPropertyAccessExpression(n.expression)&&ts.isIdentifier(n.expression.expression)&&n.expression.expression.text==="JSON"&&n.expression.name.text==="parse")emit(n,"UI JSON.parse forbidden; use session adapter");
   if(role(path)==="ui"&&ts.isElementAccessExpression(n.expression)&&ts.isIdentifier(n.expression.expression)&&n.expression.expression.text==="JSON"&&ts.isStringLiteralLike(n.expression.argumentExpression)&&n.expression.argumentExpression.text==="parse")emit(n,"UI JSON.parse forbidden; use session adapter");
  }
  ts.forEachChild(n,visit);
 };
 for(const d of sf.parseDiagnostics??[])violations.push(path+": parser diagnostic "+d.messageText);
 if(role(path)==="unknown")violations.push(path+": unclassified source directory");
 visit(sf);return violations;
}
if(process.argv.includes("--self-test")){
 const good=inspectSource("src/app/probe.tsx",'import {probeSession} from "./probe-session"; import React from "react";');
 const bad=[
 'import {x} from "../engine/core/keyed-random.mjs";',
 'export {x} from "../engine/core/keyed-random.mjs";',
 'type T=import("../engine/core/keyed-random.mjs").T;',
 'const x=import("../engine/core/keyed-random.mjs");',
 'const x=import(name);',
 'const x=require("../engine/core/keyed-random.mjs");',
 'JSON.parse(raw);','JSON["parse"](raw);',
 'import x from "../../data/fixtures/f1-g2-core-v02.json";'
 ];
 if(good.length||bad.some(s=>!inspectSource("src/app/probe.tsx",s).length))throw Error("boundary self-test failed");
 console.log("boundary AST self-test: 10/10");
}
const paths=walk(resolve(root,"src"));
const violations=paths.flatMap(p=>inspectSource(posix(relative(root,p)),readFileSync(p,"utf8")));
if(violations.length)throw Error(violations.join("\n"));
console.log(JSON.stringify({sourceFiles:paths.length,violations:0}));

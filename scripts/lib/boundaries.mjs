export function role(path){
 if(path==="src/app/probe-session.ts")return "adapter";
 if(path.startsWith("src/contracts/"))return "contracts";
 if(path.startsWith("src/engine/"))return "engine";
 if(path.startsWith("src/app/")||path.startsWith("src/ui/"))return "ui";
 if(path.startsWith("src/content/"))return "content";
 return "unknown";
}

export function normalizedImport(from,spec){
 if(typeof spec!=="string"||!spec||spec.includes("\\")||spec.includes("?")||spec.includes("#"))return null;
 if(!spec.startsWith("."))return null;
 const parts=from.split("/").slice(0,-1);
 for(const p of spec.split("/")){if(p===""||p===".")continue;if(p===".."){if(!parts.length)return null;parts.pop()}else parts.push(p)}
 return parts.join("/");
}

export function allowedImport(from,spec,kind="import"){
 const source=role(from);
 if(source==="unknown")return false;
 if(!spec.startsWith("."))return source==="ui"&&["react","react-dom/client","react/jsx-runtime","react/jsx-dev-runtime"].includes(spec);
 const dst=normalizedImport(from,spec);if(!dst)return false;
 if(source==="ui"){
  if(dst==="src/app/probe-session"||dst==="src/app/probe-session.ts")return true;
  if(dst.startsWith("src/app/probe-session/"))return false;
  return ["ui","contracts"].includes(role(dst))&&!(dst.startsWith("src/app/")&&/session-adapter|composition|bootstrap/.test(dst));
 }
 if(source==="adapter")return ["engine","contracts"].includes(role(dst));
 if(source==="contracts")return role(dst)==="contracts";
 if(source==="engine")return ["engine","contracts"].includes(role(dst));
 if(source==="content")return ["content","contracts"].includes(role(dst));
 return false;
}

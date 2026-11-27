// G2-A transport-only probe; not the game save envelope.
export function writeProbe(count:number):string {
 if(!Number.isSafeInteger(count)||count<0)throw new Error("invalid count");
 return JSON.stringify({format:"front-probe-1",count});
}
export function readProbe(rawText:string):number{
 if(rawText.length>65536)throw new Error("too large");
 const obj:unknown=JSON.parse(rawText);
 if(typeof obj!=="object"||obj===null||Array.isArray(obj))throw new Error("invalid probe");
 const data=obj as Record<string,unknown>;
 const count=data.count;
 if(data.format!=="front-probe-1"||typeof count!=="number"||!Number.isSafeInteger(count)||count<0)throw new Error("invalid probe");
 return count;
}

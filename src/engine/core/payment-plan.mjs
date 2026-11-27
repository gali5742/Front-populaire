// F1 explicit opening-time obligations. Priority is a declared fixture rule, not a historical inference.
export function planDuePayments(cash,totalDedicated,obligations){
 const safe=n=>Number.isSafeInteger(n)&&n>=0;
 if(!safe(cash)||!safe(totalDedicated)||totalDedicated>cash||!Array.isArray(obligations))throw Error("invalid payment pool");
 const ids=new Set(),payIds=[];
 let pool=cash-totalDedicated;
 for(const o of obligations){
  if(!o||typeof o.id!=="string"||ids.has(o.id)||!safe(o.month)||!safe(o.priority)||!safe(o.amount)||!safe(o.reserve)||o.reserve>o.amount)throw Error("invalid obligation");
  ids.add(o.id);
 }
 if(obligations.reduce((n,o)=>n+o.reserve,0)>totalDedicated)throw Error("dedicated pool mismatch");
 // Fully funded legal independent payments do not compete for the shared pool.
 for(const o of obligations)if(o.reserve===o.amount)payIds.push(o.id);
 const rest=obligations.filter(o=>o.reserve<o.amount);
 const groups=new Map();
 for(const o of rest){const k=o.month+":"+o.priority;const a=groups.get(k)??[];a.push(o);groups.set(k,a);}
 const ordered=[...groups.values()].sort((a,b)=>a[0].month-b[0].month||a[0].priority-b[0].priority);
 let conflict=null;
 for(const group of ordered){
  const unbacked=group.reduce((n,o)=>n+o.amount-o.reserve,0);
  if(!safe(unbacked))throw Error("demand overflow");
  if(unbacked>pool){conflict={month:group[0].month,priority:group[0].priority,ids:group.map(o=>o.id).sort(),unbacked,pool};break;}
  pool-=unbacked;for(const o of group)payIds.push(o.id);
 }
 return {payIds,restricted:conflict?pool:0,conflict};
}

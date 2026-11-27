// G2-A. Pure deterministic non-cryptographic keyed random. UTF-16LE FNV-1a64 + SplitMix64 finalizer.
export function encodeKey(seed,domain,transaction,purpose,object,ordinal=0) {
  if(!Number.isSafeInteger(seed)||seed<0||!Number.isSafeInteger(ordinal)||ordinal<0) throw new RangeError("invalid key integer");
  const fields=["front-keyed-fnv1a64-splitmix64-v1",seed,domain,transaction,purpose,object,ordinal];
  for(const x of fields.slice(2,6)) if(typeof x!=="string"||!x.length) throw new TypeError("invalid key field");
  return JSON.stringify(fields);
}

export function draw64(seed,domain,transaction,purpose,object,ordinal=0) {
  const key=encodeKey(seed,domain,transaction,purpose,object,ordinal);
  const mask=0xffffffffffffffffn;
  let h=0xcbf29ce484222325n;
  // Hash canonical JSON UTF-16 code units as little endian bytes, independent of host encoding.
  for(let i=0;i<key.length;i++){const c=key.charCodeAt(i);h=((h^BigInt(c&255))*0x100000001b3n)&mask;h=((h^BigInt(c>>>8))*0x100000001b3n)&mask;}
  let z=(h+0x9e3779b97f4a7c15n)&mask;
  z=((z^(z>>30n))*0xbf58476d1ce4e5b9n)&mask;
  z=((z^(z>>27n))*0x94d049bb133111ebn)&mask;
  return (z^(z>>31n))&mask;
}

export function uniformInt(seed,domain,transaction,purpose,object,bound) {
  if(!Number.isSafeInteger(bound)||bound<1) throw new RangeError("invalid bound");
  const b=BigInt(bound),space=1n<<64n,limit=space-space%b;
  for(let n=0;n<128;n++){const value=draw64(seed,domain,transaction,purpose,object,n);if(value<limit)return Number(value%b);}
  throw new Error("random rejection limit exceeded");
}

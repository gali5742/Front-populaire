// Public-only contract. G2-A provisional types, no WorldState exported.
export type PublicId = string;
export type GameTime = Readonly<{monthIndex:number;label:string;phase:string}>;
export type SessionSnapshot = Readonly<{time:GameTime;identity:string;actionRemaining:number;partyAvailableCentimes:number;requiredBlock:boolean;workCount:number;briefCount:number}>;
export type ArchiveQuery = Readonly<{text:string;page:number;pageSize:number}>;
export type ArchivePage = Readonly<{items:readonly Readonly<{id:PublicId;title:string;knownAt:string}>[];total:number;page:number}>;
export type DetailView = Readonly<{id:PublicId;title:string;description:string}>;
export type ActionDraft = Readonly<{actionId:PublicId;targetId:PublicId;proposalVersion:string}>;
export type QuoteView = Readonly<{quoteId:PublicId;allowed:boolean;ap:number;centimes:number;reason:string}>;
export type Command = Readonly<{requestId:string;draft:ActionDraft;confirmedQuote:QuoteView}>;
export type CommandResult = Readonly<{requestId:string;status:"committed"|"rejected";message:string;snapshot:SessionSnapshot}>;
export type ImportResult = Readonly<{ok:boolean;message:string}>;
export interface GameSession {
 getSnapshot():SessionSnapshot;
 queryArchive(query:ArchiveQuery):ArchivePage;
 queryDetail(id:PublicId):DetailView|null;
 previewQuote(draft:ActionDraft):QuoteView;
 dispatch(command:Command):CommandResult;
 importSave(rawText:string):ImportResult;
 exportSave():string;
}

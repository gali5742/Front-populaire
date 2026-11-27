// Public query and command shapes only. No WorldState exported.
export type PublicId=string;
export type GameTime=Readonly<{monthIndex:number;label:string;phase:string;checkpointDay:number|null}>;
export type SessionSnapshot=Readonly<{time:GameTime;identity:string;actionRemaining:number;partyAvailableCentimes:number;partyCashCentimes:number;restrictedCentimes:number;reservedCentimes:number;reservedAP:number;unpaidCentimes:number;unpaidGapCentimes:number;projectGapCentimes:number;requiredBlock:boolean;workCount:number;briefCount:number;profileLabel:string}>;
export type ArchiveQuery=Readonly<{text:string;page:number;pageSize:number;monthIndex?:number}>;
export type RecordSummary=Readonly<{id:PublicId;title:string;knownAt:string}>;
export type ArchivePage=Readonly<{items:readonly RecordSummary[];total:number;page:number}>;
export type DetailView=Readonly<{id:PublicId;title:string;description:string}>;
export type ActionDraft=Readonly<{actionId:PublicId;targetId:PublicId;proposalVersion:string}>;
export type QuoteView=Readonly<{quoteId:PublicId;allowed:boolean;ap:number;centimes:number;reason:string}>;
export type ActionChoice=Readonly<{id:PublicId;title:string;description:string;draft:ActionDraft;quote:QuoteView}>;
export type WorkDetail=Readonly<{id:PublicId;title:string;description:string;status:string;period:string;progress:number|null;plannedMonths:number|null;paidCentimes:number;reservedCentimes:number;nextDemandCentimes:number;operations:readonly ActionChoice[]}>;
export type Command=Readonly<{requestId:string;draft:ActionDraft;confirmedQuote:QuoteView}>;
export type CommandResult=Readonly<{requestId:string;status:"committed"|"rejected";message:string;snapshot:SessionSnapshot}>;
export type ImportResult=Readonly<{ok:boolean;message:string}>;
export interface GameSession {
 getSnapshot():SessionSnapshot;
 listActions():readonly ActionChoice[];
 queryArchive(query:ArchiveQuery):ArchivePage;
 queryWork():readonly RecordSummary[];
 queryWorkDetail(id:PublicId):WorkDetail|null;
 queryDetail(id:PublicId):DetailView|null;
 previewQuote(draft:ActionDraft):QuoteView;
 dispatch(command:Command):CommandResult;
 importSave(rawText:string):ImportResult;
 exportSave():string;
}

// Transport-only composition adapter for the G2-A probe, not a game session.
import {readProbe,writeProbe} from "../engine/persistence/probe-save";
export const probeSession={importSave:readProbe,exportSave:writeProbe};

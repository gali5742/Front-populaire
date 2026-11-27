import type {GameSession} from "../contracts/session";
import {createCoreSession} from "../engine/core/core-session.mjs";
import {rawFixture} from "../engine/config/f1-bundled.mjs";
// The composition boundary exposes only the public interface.
export const gameSession:GameSession=createCoreSession(rawFixture) as GameSession;

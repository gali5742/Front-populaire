import type {GameSession} from "../contracts/session";
import {createCoreSession} from "../engine/core/core-session.mjs";
import {rawFixture} from "../engine/config/f1-bundled.mjs";
// The composition boundary exposes only the public interface.
// Explicit synthetic browser fixture, not the ordinary game. No implicit historical events.
import {deadlineFixture} from "../engine/config/f1-deadlines.mjs";
import {paymentFixture} from "../engine/config/f1-payments.mjs";
const scenario=new URLSearchParams(window.location.search).get("scenario");
const fixture=scenario==="deadlines"?deadlineFixture:scenario==="payments"?paymentFixture:rawFixture;
export const gameSession:GameSession=createCoreSession(fixture) as GameSession;

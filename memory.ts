import { SessionStore } from "./types";

export const Memory = <Session>(): SessionStore<Session> => new Map<string, Session>();

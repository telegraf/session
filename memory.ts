import { SessionStore } from "./types";

/**
 * You should probably use builtin session instead of this.
 * This stub implementation exists for completion's sake, and for extensibility in the future.
 *
 * This is also the default import of `@telegraf/session`, but you should not import the bare path.
 * Prefer `@telegraf/session/redis` and friends.
 * */
export const Memory = <Session>(): SessionStore<Session> => new Map<string, Session>();

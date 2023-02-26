import { createClient } from "redis";
import type { RedisClientOptions } from "redis";
import { SessionStore } from "./types";

type Client = ReturnType<typeof createClient>;

interface NewClientOpts {
	/**
	 * `redis[s]://[[username][:password]@][host][:port][/db-number]`
	 *
	 * See [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details
	 */
	url?: string;
	config: Omit<RedisClientOptions, "url">;
	/** Prefix to use for session keys. Defaults to "telegraf:". */
	prefix?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

interface ExistingClientOpts {
	/** If passed, we'll reuse this client instead of creating our own. */
	client: Client;
	/** Prefix to use for session keys. Defaults to "telegraf:". */
	prefix?: string;
}

export type Opts = NewClientOpts | ExistingClientOpts;

/** @unstable */
export const Redis = <Session>(opts: Opts): SessionStore<Session> => {
	let client: Client;
	if ("client" in opts) client = opts.client;
	else client = createClient({ ...opts.config, url: opts.url });

	const connection = client.connect();

	const prefix = opts.prefix || "telegraf:";

	return {
		async get(key) {
			await connection;
			const value = await client.get(prefix + key);
			return value ? JSON.parse(value) : undefined;
		},
		async set(key: string, session: Session) {
			await connection;
			return await client.set(prefix + key, JSON.stringify(session));
		},
		async delete(key: string) {
			await connection;
			return await client.del(prefix + key);
		},
	};
};

import { Knex, knex } from "knex";
import { SessionStore } from "./types";

interface NewClientOpts {
	/**
	 * Knex database config.
	 *
	 * Remember to install the corresponding db driver.
	 *
	 * @see {@link https://knexjs.org/guide/#configuration-options Knex | Configuration Options}
	 * */
	config: Knex.Config;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on Mongo::connect errors */
	onConnectError?: (err: unknown) => void;
}

interface ExistingClientOpts {
	/** If passed, we'll reuse this client instead of creating our own. */
	connection: Knex;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
}

export type Opts = NewClientOpts | ExistingClientOpts;

export const SQL = <Session>(opts: Opts): SessionStore<Session> => {
	interface SessionTable {
		key: string;
		session: Session;
	}

	const table = opts.table || "telegraf-sessions";

	let client: Knex;
	if ("connection" in opts) client = opts.connection;
	else client = knex(opts.config);

	const q = client<SessionTable>(table);

	return {
		async get(key) {
			return (await q.select("session").where({ key }).limit(1)).at(0)?.session;
		},
		async set(key: string, session: Session) {
			return await q.update({ session }).where({ key });
		},
		async delete(key: string) {
			return await q.delete().where({ key });
		},
	};
};

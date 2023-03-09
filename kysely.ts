import { Kysely } from "kysely";
import type { KyselyConfig } from "kysely";
import type { SessionStore } from "./types";
import { defaults } from "./defaults";

interface SessionTable {
	key: string;
	session: string;
}

interface Database {
	"telegraf-sessions": SessionTable;
}

interface NewClientOpts {
	/**
	 * Knex database config.
	 *
	 * Remember to install the corresponding db driver.
	 *
	 * @see {@link https://knexjs.org/guide/#configuration-options Knex | Configuration Options}
	 * */
	config: KyselyConfig;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

interface ExistingClientOpts {
	/** If passed, we'll reuse this client instead of creating our own. */
	client: Kysely<Database>;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

export type Opts = NewClientOpts | ExistingClientOpts;

/** @unstable */
export const KyselyStore = <Session>(opts: Opts): SessionStore<Session> => {
	// this assertion is a hack to make the Database type work
	const table = (opts.table ?? defaults.table) as "telegraf-sessions";

	let client: Kysely<Database>;
	if ("client" in opts) client = opts.client;
	else client = new Kysely(opts.config);

	const create = client.schema
		.createTable(table)
		.ifNotExists()
		.addColumn("key", "varchar(32)", col => col.notNull())
		.addColumn("session", "text")
		.execute();

	if ("onInitError" in opts) create.catch(opts.onInitError);

	return {
		async get(key) {
			await create;

			const value = (
				await client
					//
					.selectFrom(table)
					.select("session")
					.where("key", "=", key)
					.executeTakeFirst()
			)?.session;

			return value ? JSON.parse(value) : undefined;
		},
		async set(key: string, session: Session) {
			await create;

			await client
				.updateTable(table)
				.set({ session: JSON.stringify(session) })
				.where("key", "=", key)
				.executeTakeFirst();
		},
		async delete(key: string) {
			await create;

			await client //
				.deleteFrom(table)
				.where("key", "=", key)
				.executeTakeFirst();
		},
	};
};

import { Kysely, MysqlDialect } from "kysely";
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

/** @unstable */
export const KyselyStore = <Session>(opts: NewClientOpts): SessionStore<Session> => {
	// this assertion is a hack to make the Database type work
	const table = (opts.table ?? defaults.table) as "telegraf-sessions";

	const client: Kysely<Database> = new Kysely(opts.config);

	const create = client.schema
		.createTable(table)
		.ifNotExists()
		.addColumn("key", "varchar(32)", col => col.primaryKey().notNull())
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
					.limit(1)
					.executeTakeFirst()
			)?.session;

			return value ? JSON.parse(value) : undefined;
		},
		async set(key: string, value: Session) {
			await create;

			const session = JSON.stringify(value);

			const res = await (opts.config.dialect instanceof MysqlDialect
				? client
						.insertInto(table)
						.values({ key, session })
						// MySQL has ON DUPLICATE KEY UPDATE
						.onDuplicateKeyUpdate({ session })
				: client
						.insertInto(table)
						.values({ key, session })
						// Postgres and SQLITE have ON CONFLICT DO UPDATE SET
						.onConflict(b => b.column("key").doUpdateSet({ session }))
			).executeTakeFirst();
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

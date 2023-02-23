import { PostgresDialect } from "kysely";
import { Pool, PoolConfig } from "pg";
import { KyselyStore } from "./kysely";

interface NewPoolOpts {
	/**
	 * Postgres Pool config.
	 *
	 * Remember to install the db driver `'pg'`.
	 *
	 * @see {@link https://node-postgres.com/apis/pool node-postgres | Pool Options}
	 * */
	config: PoolConfig;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

interface ExistingPoolOpts {
	/** If passed, we'll reuse this instance of pg Pool instead of creating our own. */
	pool: Pool;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

export type Opts = NewPoolOpts | ExistingPoolOpts;

/** @unstable */
export const Postgres = (opts: Opts) =>
	KyselyStore({
		config:
			"pool" in opts
				? { dialect: new PostgresDialect({ pool: opts.pool }) }
				: { dialect: new PostgresDialect({ pool: new Pool(opts.config) }) },
		table: opts.table,
		onInitError: opts.onInitError,
	});

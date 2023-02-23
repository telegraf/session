import { MysqlDialect } from "kysely";
import { createPool, Pool, PoolOptions } from "mysql2";
import { KyselyStore } from "./kysely";

interface NewPoolOpts {
	/**
	 * MySQL2 Pool options.
	 *
	 * Remember to install the db driver `'mysql2'`.
	 *
	 * @see {@link https://github.com/sidorares/node-mysql2#using-connection-pools Node MySQL 2 | Using connection pools}
	 * */
	config: PoolOptions;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

interface ExistingPoolOpts {
	/** If passed, we'll reuse this instance of MySQL2 Pool instead of creating our own. */
	pool: Pool;
	/** Table name to use for sessions. Defaults to "telegraf-sessions". */
	table?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

export type Opts = NewPoolOpts | ExistingPoolOpts;

/** @unstable */
export const MySQL = (opts: Opts) =>
	KyselyStore({
		config:
			"pool" in opts
				? { dialect: new MysqlDialect({ pool: opts.pool }) }
				: { dialect: new MysqlDialect({ pool: createPool(opts.config) }) },
		table: opts.table,
		onInitError: opts.onInitError,
	});

import { MysqlDialect } from "kysely";
import { createPool, Pool, PoolOptions } from "mysql2";
import { KyselyStore } from "./kysely";
import { SessionStore } from "./types";

interface NewPoolOpts {
	host?: string | undefined;
	port?: number | undefined;
	database?: string | undefined;
	user?: string | undefined;
	password?: string;
	/**
	 * MySQL2 Pool options.
	 *
	 * Remember to install the db driver `'mysql2'`.
	 *
	 * @see {@link https://github.com/sidorares/node-mysql2#using-connection-pools Node MySQL 2 | Using connection pools}
	 * */
	config: Omit<PoolOptions, "host" | "port" | "database" | "user" | "password">;
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

/** @unstable */
export function MySQL<Session>(opts: NewPoolOpts): SessionStore<Session>;
export function MySQL<Session>(opts: ExistingPoolOpts): SessionStore<Session>;
export function MySQL<Session>(opts: NewPoolOpts | ExistingPoolOpts) {
	return KyselyStore<Session>({
		config:
			"pool" in opts
				? { dialect: new MysqlDialect({ pool: opts.pool }) }
				: {
						dialect: new MysqlDialect({
							pool: createPool({
								host: opts.host,
								port: opts.port,
								database: opts.database,
								user: opts.user,
								password: opts.password,
								...opts.config,
							}),
						}),
				  },
		table: opts.table,
		onInitError: opts.onInitError,
	});
}

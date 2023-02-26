import { PostgresDialect } from "kysely";
import { Pool, PoolConfig } from "pg";
import { KyselyStore } from "./kysely";
import { SessionStore } from "./types";

interface NewPoolOpts {
	host?: string | undefined;
	port?: number | undefined;
	database?: string | undefined;
	user?: string | undefined;
	password?: string | (() => string | Promise<string>) | undefined;
	/**
	 * Postgres Pool config.
	 *
	 * Remember to install the db driver `'pg'`.
	 *
	 * @see {@link https://node-postgres.com/apis/pool node-postgres | Pool Options}
	 * */
	config: Omit<PoolConfig, "host" | "port" | "database" | "user" | "password">;
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

/** @unstable */
export function Postgres<Session>(opts: NewPoolOpts): SessionStore<Session>;
export function Postgres<Session>(opts: ExistingPoolOpts): SessionStore<Session>;
export function Postgres<Session>(opts: NewPoolOpts | ExistingPoolOpts) {
	return KyselyStore<Session>({
		config:
			"pool" in opts
				? { dialect: new PostgresDialect({ pool: opts.pool }) }
				: {
						dialect: new PostgresDialect({
							pool: new Pool({
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

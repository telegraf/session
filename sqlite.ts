import { SqliteDialect } from "kysely";
import { Database as Db, Options } from "better-sqlite3";
import { KyselyStore } from "./kysely";
import Database = require("better-sqlite3");

interface NewDatabaseOpts {
	/** Filename to use for SQLite sessions. */
	filename: string;
	/**
	 * Better-SQLite3 new Database options.
	 *
	 * Remember to install the db driver `'better-sqlite3'`.
	 *
	 * @see {@link https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options Better-SQLite3 | new Database}
	 * */
	config?: Options;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

interface ExistingDatabaseOpts {
	/** If passed, we'll reuse this instance of Better-SQLite3 Database instead of creating our own. */
	database: Db;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

export type Opts = NewDatabaseOpts | ExistingDatabaseOpts;

/** @unstable */
export const SQLite = <Session>(opts: Opts) =>
	KyselyStore<Session>({
		config:
			"database" in opts
				? { dialect: new SqliteDialect({ database: opts.database }) }
				: { dialect: new SqliteDialect({ database: new Database(opts.filename, opts.config) }) },
		onInitError: opts.onInitError,
	});

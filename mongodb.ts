import { MongoClient, MongoClientOptions } from "mongodb";
import { defaults } from "./defaults";
import { SessionStore } from "./types";

interface NewClientOpts {
	/** MongoDB connection URL; required. */
	url: string;
	/**
	 * MongoDB MongoClientOptions.
	 *
	 * Remember to install the db driver `'mongodb'`.
	 *
	 * @see {@link https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connection-options MongoDB | Connection Options}
	 * */
	config?: MongoClientOptions;
	/** The name of the database we want to use. If not provided, database name will be taken from connection string. */
	database?: string;
	/** MongoDB collection name to use for sessions. Defaults to "telegraf-sessions". */
	collection?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

interface ExistingClientOpts {
	/** If passed, we'll reuse this client instead of creating our own. */
	client: MongoClient;
	/** The name of the database we want to use. If not provided, database name will be taken from connection string. */
	database?: string;
	/** MongoDB collection name to use for sessions. Defaults to "telegraf-sessions". */
	collection?: string;
	/** Called on fatal connection or setup errors */
	onInitError?: (err: unknown) => void;
}

/** @unstable */
export function Mongo<Session>(opts: NewClientOpts): SessionStore<Session>;
export function Mongo<Session>(opts: ExistingClientOpts): SessionStore<Session>;
export function Mongo<Session>(opts: NewClientOpts | ExistingClientOpts): SessionStore<Session> {
	interface SessionDoc {
		key: string;
		session: Session;
	}

	let client: MongoClient;
	let connection: Promise<MongoClient> | undefined;

	if ("client" in opts) client = opts.client;
	else {
		client = new MongoClient(opts.url, opts.config);
		connection = client.connect();
		connection.catch(opts.onInitError);
	}

	const collection = client.db(opts.database).collection<SessionDoc>(opts.collection ?? defaults.table);

	return {
		async get(key) {
			// since we synchronously return store instance
			await connection;
			return (await collection.findOne({ key }))?.session;
		},
		async set(key: string, session: Session) {
			await connection;
			await collection.updateOne({ key }, { $set: { key, session } }, { upsert: true });
		},
		async delete(key: string) {
			await connection;
			await collection.deleteOne({ key });
		},
	};
}

import { MongoClient, MongoClientOptions } from "mongodb";
import { SessionStore } from "./types";

interface NewClientOpts {
	/** MongoDB connection URL; required. */
	url: string;
	/** Optional MongoClientOptions. */
	mongo?: MongoClientOptions;
	/** MongoDB collection name to use for sessions. Defaults to "telegraf-sessions". */
	collection?: string;
	/** Called on Mongo::connect errors */
	onConnectError?: (err: unknown) => void;
}

interface ExistingClientOpts {
	/** If passed, we'll reuse this client instead of creating our own. */
	client: MongoClient;
	/** MongoDB collection name to use for sessions. Defaults to "telegraf-sessions". */
	collection?: string;
}

export type Opts = NewClientOpts | ExistingClientOpts;

export const Mongo = <Session>(opts: Opts): SessionStore<Session> => {
	interface SessionDoc {
		key: string;
		session: Session;
	}

	let client;
	let connection: Promise<MongoClient> | undefined;

	if ("client" in opts) client = opts.client;
	else {
		client = new MongoClient(opts.url, opts.mongo);
		connection = client.connect();
		connection.catch(opts.onConnectError);
	}

	const collection = client.db().collection<SessionDoc>(opts.collection || "telegraf-sessions");

	return {
		async get(key) {
			// since we synchronously return store instance
			await connection;
			return (await collection.findOne({ key }))?.session;
		},
		async set(key: string, session: Session) {
			await connection;
			await collection.updateOne(
				{ key },
				// @ts-expect-error session as a geeneric doesn't work for some reason
				{ $set: { key, session } },
				{ upsert: true },
			);
		},
		async delete(key: string) {
			await connection;
			await collection.deleteOne({ key });
		},
	};
};

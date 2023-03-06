// surrealDB adapter for telegraf session

import * as Surreal from "surrealdb.js";
import { SessionStore } from "./types";
import {defaults} from "./defaults";


type TSurrealRecord = {
	id: string;
	value: any;
}
interface NewClientOpts {
	url?: string;
	auth?: Surreal.RootAuth;
	namespace?: string;
	database?: string;
	onInitError?: (err: unknown) => void;
}

interface ExistingClientOpts {
	client: Surreal.default;
}

export function SurrealDB<Session>(opts: NewClientOpts): SessionStore<Session>;
export function SurrealDB<Session>(opts: ExistingClientOpts): SessionStore<Session>;
export function SurrealDB<Session>(opts: NewClientOpts | ExistingClientOpts): SessionStore<Session> {
	interface SessionDoc {
		key: string;
		session: Session;
	}

	let client: Surreal.default;

	if ("client" in opts) client = opts.client;
	else {
		client = new Surreal.default(`${opts.url}/rpc`);
		client.signin(opts.auth!)
			.then(async () => {
				await client.use(opts.namespace!, opts.database!);
			})
			.catch(opts.onInitError!);
	}

	// Small changes associated with the naming rules:
	// - replacement "-" on "_" in the name of the base,
	// - replacement ":" on "_" in the identifier.
	const surrealDefaultTable = defaults.table.replace(/-/g, '_');
	const surrealId = (key: string): string => `${surrealDefaultTable}:${key.replace(/:/g, '_')}`;

	return {
		async get(key) {
			await client.wait();
			const resp = await client.query(`SELECT * FROM ${surrealDefaultTable} WHERE id=${surrealId(key)}`);
			const result: TSurrealRecord[] = resp[0].result as TSurrealRecord[];
			if (result.length === 0) return undefined;
			return  result[0].value;
		},
		async set(key: string, session: Session) {
			await client.wait();
			return await client.update(surrealId(key), {value: session});
		},
		async delete(key: string) {
			await client.wait();
			return await client.delete(surrealId(key));
		},
	};
}

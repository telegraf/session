import {
	StaticCredentialsAuthService,
	Column,
	Driver,
	getCredentialsFromEnv,
	Logger,
	TableDescription,
	Types,
	TypedData,
	ReadTableSettings, TypedValues
} from 'ydb-sdk';

import { SessionStore } from "./types";
import { defaults } from "./defaults";

interface NewClientOpts {

	//static
	StaticCredentials: {
		user:string
		password:string
	}

	tokenExpirationTimeout: number
	endpointUrl: string
	databaseName: string

	tableName?: string
	onInitError?: (err: unknown) => void
	connectionTimeout: number
}
interface ExistingClientOpts {

	client: Driver
	tableName?: string
	onInitError?: (err: unknown) => void
	connectionTimeout: number
}

/** @unstable */
export function YDB<Session>(opts: NewClientOpts): SessionStore<Session>;
export function YDB<Session>(opts: ExistingClientOpts): SessionStore<Session>;
export function YDB<Session>(opts: NewClientOpts | ExistingClientOpts): SessionStore<Session> {

	// this assertion is a hack to make the Database type work
	const tablename = (opts.tableName ?? defaults.table)

	let client: Driver;
	let connection: Promise<boolean> | undefined;

	if ("client" in opts) client = opts.client;
	else {
		const authService = new StaticCredentialsAuthService(
				opts.StaticCredentials.user,
				opts.StaticCredentials.password,
				opts.endpointUrl,
			{
					tokenExpirationTimeout: opts.tokenExpirationTimeout,
			})

		client = new Driver({endpoint: opts.endpointUrl, database: opts.databaseName, authService})
		connection = client.ready(opts.connectionTimeout)
		connection.catch(opts.onInitError)
	}

	const create = client.tableClient.withSession(async session => {
								await session.createTable(tablename,
										new TableDescription()
											.withColumn(new Column('key', Types.optional(Types.TEXT)))
											.withColumn(new Column('session', Types.optional(Types.TEXT)))
											.withPrimaryKey('key'))
								}, opts.connectionTimeout)

	return {
		async get(key: string) {

			const query = `
					DECLARE $keyValue AS TEXT;
					$table_name = "${tablename}";
					select key, session from $table_name
					where key= $keyValue`

			const params = {
				'$keyValue': TypedValues.text(key),
			};

			let value: string | undefined | null

			await connection
			await create

			await client.tableClient.withSession(async session=> {
				const result = await session.executeQuery(query, params)
				if(result.resultSets.length > 0) {
					const resultSet = result.resultSets[0];
					const data = TypedData.createNativeObjects(resultSet);
					if (data.length > 0) value = data[0].getValue("session").textValue
				}
			})

			return value ? JSON.parse(value) : undefined;
		},
		async set(key: string, session: Session) {

			const query = `
								DECLARE $keyValue AS TEXT;
								DECLARE $sessionValue AS TEXT;
								$table_name = "${tablename}";
								UPSERT INTO $table_name	(key, session)
								VALUES ( $keyValue, $sessionValue);`

			const params = {
				'$keyValue': TypedValues.text(key),
				'$sessionValue':TypedValues.text(JSON.stringify(session))
			};

			await connection
			await create

			await client.tableClient.withSession(async ydbSession => {
				await ydbSession.executeQuery(query, params)
			})

		},
		async delete(key: string) {

			const query = `
								DECLARE $keyValue AS TEXT;
								$table_name = "${tablename}";
								delete from $table_name where key = $keyValue`

			const params = {
				'$keyValue': TypedValues.text(key)
			};

			await connection
			await create

			return await client.tableClient.withSession(async session => {
				await session.executeQuery(query, params)
			})
		},
	};
}

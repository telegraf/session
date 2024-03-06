import {
	StaticCredentialsAuthService,
	Column,
	Driver,
	getCredentialsFromEnv,
	Logger,
	TableDescription,
	Types,
	TypedData,
	ReadTableSettings
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
					tokenExpirationTimeout: 20000,
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
		async get(key) {

			const keyIValue = {value: {textValue: key}}
			let value: string | undefined | null

			await connection
			await create

			await client.tableClient.withSession(async session=>{
				await session.streamReadTable(tablename,result => {
					const resultSet = result.resultSet;
					if (resultSet) {
						const data = TypedData.createNativeObjects(resultSet);
						if(data.length >= 0) value = data[0].getValue("session").textValue
					}
				}, new ReadTableSettings()
					.withColumns("session")
					.withKeyRange({greaterOrEqual: keyIValue , lessOrEqual: keyIValue })
					.withRowLimit(1)
				)
			})

			return value ? JSON.parse(value) : undefined;
		},
		async set(key: string, session: Session) {

			const query = `UPSERT INTO ${tablename}
    							( 'key', 'session' )
								VALUES ( '${key}', '${JSON.stringify(session)}');`

			await connection
			await create

			await client.tableClient.withSession(async ydbSession => {
				await ydbSession.executeQuery(query)
			})

		},
		async delete(key: string) {

			await connection
			await create

			const query = `delete from ${tablename} where key = '${key}'`
			return await client.tableClient.withSession(async session => {
				await session.executeQuery(query)
			})
		},
	};
}

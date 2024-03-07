import {
	StaticCredentialsAuthService,
	Column,
	Driver,
	getCredentialsFromEnv,
	TableDescription,
	Types,
	TypedData,
	TypedValues, IAuthService, getSACredentialsFromJson, IamAuthService, AnonymousAuthService, Session as YdbSession
} from 'ydb-sdk';

import { SessionStore } from "./types";
import { defaults } from "./defaults";

//#region AuthOptions
export enum AuthTypes {
	Static,
	Environment,
	Json
}

interface IStaticCredentials {

	authType: AuthTypes.Static,
	user:string,
	password:string
}
interface IJSONCredentials {
	authType: AuthTypes.Json,
	jsonFileName: string
}
interface IEnvCredentials {
	authType: AuthTypes.Environment
}

type AuthOptionsType = IStaticCredentials | IEnvCredentials | IJSONCredentials

function isStaticCredentialsAuthOptions(authOptions: AuthOptionsType): authOptions is IStaticCredentials {
	return authOptions.authType === AuthTypes.Static
}
function isEnvCredentialsAuthOptions(authOptions: AuthOptionsType): authOptions is IEnvCredentials {
	return authOptions.authType === AuthTypes.Environment
}
function isJsonCredentialsAuthOptions(authOptions: AuthOptionsType): authOptions is IJSONCredentials {
	return authOptions.authType === AuthTypes.Json
}
//#endregion

interface NewClientOpts {

	authOptions?: AuthOptionsType

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
	let authService: IAuthService = new AnonymousAuthService()

	if ("client" in opts) client = opts.client;
	else {
		if(opts.authOptions) {
			if (isStaticCredentialsAuthOptions(opts.authOptions)) {
				authService = new StaticCredentialsAuthService(
					opts.authOptions.user,
					opts.authOptions.password,
					opts.endpointUrl,
					{
						tokenExpirationTimeout: opts.tokenExpirationTimeout,
					})
			}
			if (isEnvCredentialsAuthOptions(opts.authOptions)) {
				authService = getCredentialsFromEnv()
			}
			if (isJsonCredentialsAuthOptions(opts.authOptions)) {
				authService = new IamAuthService(getSACredentialsFromJson(opts.authOptions.jsonFileName))
			}
		}

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

			await client.tableClient.withSession(async (ydbSession: YdbSession) => {
				const result = await ydbSession.executeQuery(query, params)
				if(result.resultSets.length > 0) {
					const resultSet = result.resultSets[0];
					const data = TypedData.createNativeObjects(resultSet);
					if (data.length > 0 && data[0].hasOwnProperty("session")) value = data[0]["session"]
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

			await client.tableClient.withSession(async (ydbSession: YdbSession) => {
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

			return await client.tableClient.withSession(async (ydbSession: YdbSession) => {
				await ydbSession.executeQuery(query, params)
			})
		},
	};
}

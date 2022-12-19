export type MaybePromise<T> = T | Promise<T>;

type Any = {} | undefined | null;

export interface SessionStore<T> {
	get: (name: string) => MaybePromise<T | undefined>;
	set: (name: string, value: T) => MaybePromise<Any>;
	delete: (name: string) => MaybePromise<Any>;
}

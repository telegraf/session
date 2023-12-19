# `@telegraf/session`

This package provides official storage adapters for Telegraf v4.12+ sessions [[see motivation]](#background).

> [!WARNING]
> **You're not meant to import the default path!** Read one of the following sections before using this module.

An in-memory session module is bundled with Telegraf. The following modules are available here:

-   [Redis](#redis)
-   [MongoDB](#mongodb)
-   [SQLite](#sqlite)
-   [PostgreSQL](#postgresql)
-   [MySQL / MariaDB](#mysql--mariadb)

## Redis

Install the official Redis driver alongside this module.

```shell
npm i @telegraf/session redis
```

Usage is pretty straightforward:

```TS
import { Redis } from "@telegraf/session/redis";

const store = Redis({
	url: "redis://127.0.0.1:6379",
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

To reuse an existing Redis client, use `Redis({ client })` instead.

## MongoDB

Install the official MongoDB driver alongside this module.

```shell
npm i @telegraf/session mongodb
```

Usage is pretty straightforward:

```TS
import { Mongo } from "@telegraf/session/mongodb";

const store = Mongo({
	url: "mongodb://127.0.0.1:27017",
	database: "telegraf-bot",
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

To reuse an existing MongoDB client, use `Mongo({ client })` instead.

## SQLite

Install the Better-SQLite3 driver and types alongside this module.

```shell
npm i @telegraf/session kysely better-sqlite3
npm i --save-dev @types/better-sqlite3
```

Usage is pretty straightforward:

```TS
import { SQLite } from "@telegraf/session/sqlite";

const store = SQLite({
	filename: "./telegraf-sessions.sqlite",
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

To reuse an existing Better-SQLite3 database instance, use `SQLite({ database })` instead.

## PostgreSQL

Install the 'pg' PostgreSQL driver and types alongside this module.

```shell
npm i @telegraf/session kysely pg
npm i --save-dev @types/pg
```

Usage is pretty straightforward:

```TS
import { Postgres } from "@telegraf/session/pg";

const store = Postgres({
	host: "127.0.0.1",
	database: "telegraf-test",
	user: "database-user",
	password: "hunter2",
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

To reuse an existing pg pool, use `Postgres({ pool })` instead.

## MySQL / MariaDB

Install the 'mysql2' MySQL driver alongside this module.

```shell
npm i @telegraf/session kysely mysql2
```

Usage is pretty straightforward:

```TS
import { MySQL } from "@telegraf/session/mysql";

const store = MySQL({
	host: "127.0.0.1",
	database: "telegraf-test",
	user: "database-user",
	password: "hunter2",
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

To reuse an existing MySQL2 pool, use `MySQL({ pool })` instead.

## Background

Since [telegraf#1372](https://github.com/telegraf/telegraf/issues/1372), it has been known that all asynchronous session middleware have been prone to race-conditions. This was addressed in [telegraf#1713](https://github.com/telegraf/telegraf/pull/1713), but third-party session middleware continue to be affected. Since Telegraf 1.12.0, it's recommended that third-party plugins only provide the store parameter for session, instead of implementing session themselves. This way, they can take advantage of the safety provided by Telegraf's builtin session. Of course, if your plugin has an exceptional usecase, it may need to implement its own middleware.

To begin to solve this problem, we officially maintain the 5 most common storage backends. This package is considered beta, and may have minor breaking changes and bugfixes before a semver stable release. Feedback is welcome via issues and in the group: [TelegrafJSChat](https://t.me/TelegrafJSChat)

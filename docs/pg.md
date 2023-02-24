# PostgreSQL

Install the 'pg' PostgreSQL driver and types alongside this module.

```shell
npm i @telegraf/session kysely pg
npm i --save-dev @types/pg
```

Usage is pretty straightforward:

```TS
import { Postgres } from "@telegraf/session/pg";

const store = Postgres({
	config: { host: 'localhost', user: 'database-user', database: 'telegraf' },
	table: 'telegraf-sessions',
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

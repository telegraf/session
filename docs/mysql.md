# MySQL / MariaDB

Install the 'mysql2' MySQL driver alongside this module.

```shell
npm i @telegraf/session kysely mysql2
```

Usage is pretty straightforward:

```TS
import { MySQL } from "@telegraf/session/mysql";

const store = MySQL({
	config: { host: 'localhost', user: 'database-user', database: 'telegraf' },
	table: 'telegraf-sessions',
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

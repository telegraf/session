# SQLite3

Install the Better-SQLite3 driver and types alongside this module.

```shell
npm i @telegraf/session kysely better-sqlite3
npm i --save-dev @types/better-sqlite3
```

Usage is pretty straightforward:

```TS
import { SQLite } from "@telegraf/session/sqlite";

const store = SQLite({ filename: "telegraf-sessions.sqlite" });

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

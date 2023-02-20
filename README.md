# `@telegraf/session`

This package provides official storage adapters for Telegraf v4.12+ sessions.

An in-memory session module is bundled with Telegraf. These modules are available here:

-   [Redis](#redis)
-   [MongoDB](#mongodb)
-   [SQL](#sql-via-knex)

## Redis

Install the official Redis driver alongside this module.

```shell
npm i @telegraf/session redis
```

Usage is pretty straightforward:

```TS
import { Redis } from "@telegraf/session/redis";

const store = Redis({ config: { url: "redis://127.0.0.1:6379" } });

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

## MongoDB

Install the official MongoDB driver alongside this module.

```shell
npm i @telegraf/session mongodb
```

Usage is pretty straightforward:

```TS
import { Mongo } from "@telegraf/session/mongodb";

const store = Mongo({ url: "mongodb://localhost:27017" });

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

## SQL (via Kysely)

This adapter works for: PostgreSQL, MySQL, MariaDB, SQLite3 and other compatible databases.

```shell
# install kysely and a compatible database driver
# all options: https://koskimas.github.io/kysely
npm i @telegraf/session kysely mysql2
```

```TS
import { SQL } from "@telegraf/session/sql";

const store = SQL({
  // Knex config
  config: {
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'your_database_user',
      password : 'your_database_password',
      database : 'your_bot'
    }
  }
});

const bot = new Telegraf(token, opts);
bot.use(session({ store }));

// the rest of your bot
```

For more details, refer to [knexjs.org](https://knexjs.org).

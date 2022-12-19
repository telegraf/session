# `@telegraf/session`

This package provides official adapters for Telegraf v4.12+ sessions.

The default in-memory session module is bundled with Telegraf. These modules are available here:

* [MongoDB](#mongodb)
* [SQL](#sql-via-knex)

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
// rest of your bot
```

## SQL (via Knex)

This adapter works for: PostgreSQL, CockroachDB, MSSQL, MySQL, MariaDB, SQLite3, Better-SQLite3, Oracle, Amazon Redshift, and other compatible databases.

```shell
# install knex and a compatible database driver
# all options: https://knexjs.org/guide/#node-js
npm i @telegraf/session knex mysql
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
// rest of your bot
```

For more details, refer to [knexjs.org](https://knexjs.org).

# `@telegraf/session`

This package provides official storage adapters for Telegraf v4.12+ sessions.

An in-memory session module is bundled with Telegraf. These modules are available here:

-   [Redis](./docs/redis.md)
-   [MongoDB](./docs/mongodb.md)
-   [SQLite](./docs/sqlite.md)
-   [PostgreSQL](./docs/pg.md)
-   [MySQL / MariaDB](./docs/mysql.md)

## Background

Since [telegraf#1372](https://github.com/telegraf/telegraf/issues/1372), it has been known that all asynchronous session middleware have been prone to race-conditions. This was addressed in [telegraf#1713](https://github.com/telegraf/telegraf/pull/1713), but third-party session middleware continue to be affected. Since Telegraf 1.12.0, it's recommended that third-party middleware only provide the store parameter for session, instead of implementing session themselves. This way, they can take advantage of the safety provided by Telegraf's builtin session. Of course, if your plugin has an exceptional case, it may need to implement a middleware.

To begin to solve this problem, we officially maintain the 5 most common storage backends. This package is considered beta, and while it appears stable, it may have changes and bugfixes before a semver stable release.

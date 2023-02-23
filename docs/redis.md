# Redis

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

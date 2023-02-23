# MongoDB

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

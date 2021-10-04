# ProBot.DB
### ProBot embed messages feature based database, lol.

Store your data in ProBot database easily, using the embed messages feature, for free :).

## Installation

```sh
npm i -S probot.db
````

## Usage
Now all you need is a server ID with ProBot, and your auth token from probot.io.
```js
const ProBotDB = require('probot.db');
const database = new ProBotDB('auth token', 'server ID', 'embed name');

await database.set('foo', 'bar');
await database.get('foo'); // bar
await database.delete('foo');
await database.clear();
```
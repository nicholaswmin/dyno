# 🧵 Threadpool

> a [threadpool][threadpool] based on [`child_process.fork`][cp-fork]

## Usage

```bash
npm i @nicholaswmin/threadpool
```

Run `thread.js` in `4` threads, sending `ping`/`pong`s between them:

```js
// primary.js
import { Threadpool } from '@nicholaswmin/threadpool'

const pool = await (new Threadpool('thread.js', 4)).start()

for (const thread of pool.threads())
  thread.on('pong', () => {
    console.log('🏓 pong')
    thread.emit('ping')
  })
```

then:

```js
// thread.js
import { primary } from '@nicholaswmin/threadpool'

primary.on('ping', () => {
  console.log('ping 🏓')
  setTimeout(() => primary.emit('pong'), 50)
})

primary.emit('pong')

setTimeout(() => process.disconnect(), 1000)
```

run:

```bash
node primary.js
```

## Todos

- [] implement `.ping()` method

## test 

```bash 
node run --test
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

The [MIT-0][license] License 

[threadpool]: https://en.wikipedia.org/wiki/Thread_pool
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options

[nicholaswmin]: https://github.com/nicholaswmin
[license]: https://spdx.org/licenses/MIT-0.html

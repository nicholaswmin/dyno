[![test-workflow][test-badge]][test-workflow]

# 🧵 threadpool

> a [threadpool][threadpool] 

## Usage

```bash
npm i https://github.com/nicholaswmin/threadpool
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

and in `thread.js`:

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

then run:

```bash
node primary.js
```

## Todos

- [] implement `.ping()` method

## test 

```bash 
node run --test

# ping 🏓
# 🏓 pong
# ping 🏓
# 🏓 pong
# 
# ...
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

The [MIT-0][license] License 

[threadpool]: https://en.wikipedia.org/wiki/Thread_pool
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options

[nicholaswmin]: https://github.com/nicholaswmin
[license]: https://spdx.org/licenses/MIT-0.html

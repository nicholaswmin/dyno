[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :stopwatch: dyno

# 🧵 threadpool

> a [threadpool][threadpool] with threads that are easy to talk to

## Install

```bash
npm i https://github.com/nicholaswmin/threadpool
```

## Run

Run `thread.js` in `4` threads, sending `ping`/`pong`s between them:

```js
// primary.js
import { Threadpool } from '@nicholaswmin/threadpool'

const pool = await (new Threadpool('thread.js', 4)).start()

for (const thread of pool.threads)
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

# ping 🏓
# 🏓 pong
# ping 🏓
# 🏓 pong
# 
# ...
```

## Gotchas 

- "threads" are based on [`child_process.fork()`][cp-fork]
- a thread must exit within `200ms`, otherwise it gets reaped by 
  [`SIGKILL`][sigkill].

## Test 

```bash 
node --run test
```

### Coverage 

```bash
node --run test:coverage
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

The [MIT-0][license] License 


[test-badge]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml/badge.svg
[test-url]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml
[dep-badge]: https://img.shields.io/badge/dependencies-0-b.svg
[dep-url]: https://blog.author.io/npm-needs-a-personal-trainer-537e0f8859c6

[threadpool]: https://en.wikipedia.org/wiki/Thread_pool
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[sigkill]: https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html#index-SIGKILL

[nicholaswmin]: https://github.com/nicholaswmin
[license]: https://spdx.org/licenses/MIT-0.html

[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> a [threadpool][threadpool] with event-emitter threads

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

pool.threads.at(0).emit('ping')

setTimeout(() => pool.stop(), 3 * 1000)
```

and in `thread.js`:

```js
// thread.js
import { primary } from '@nicholaswmin/threadpool'

primary.on('ping', () => {
  console.log('ping 🏓')

  setTimeout(() => primary.emit('pong'), 50)
})
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

## API

#### `pool.start(modulePath, size, env)`

Starts the pool

| name         | description                                 |
|--------------|---------------------------------------------|
| `modulePath` | file path of per-thread code                |
| `size`       | number of threads                           |
| `env`        | Environment key-value pairs for each thread |

#### `pool.stop()`

Stops the pool, returns an array of thread exit codes

#### `pool.threads`

Array of threads

Threads have an [Event-Emitter][ee]-like API which allows sending messages
between a thread and the parent/primary process.

See the example above for usage info.

#### `pool.on('thread-error', callback)`

The `thread-error` event is emitted if a runtime error is encountered in 
a thread.

## Gotchas 

- "threads" are based on [`child_process.fork()`][cp-fork], so technically 
  it's multiprocessing rather than multithreading.
- Avoid blocking the event-loop, especially on startup.  
  Internally, a `ready` handshake takes place to confirm a succesful spawn.  
  A blocked loop means the handshake might time-out.
- Avoid long cleanups after calling `pool.stop()`.  
  Threads that take a long time to exit are [`SIGKILL`][sigkill]-ed.

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
[ee]: https://nodejs.org/docs/latest/api/events.html#emitteremiteventname-args

[nicholaswmin]: https://github.com/nicholaswmin
[license]: https://spdx.org/licenses/MIT-0.html

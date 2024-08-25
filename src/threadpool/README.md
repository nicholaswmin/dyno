[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> a [threadpool][threadpool] with event-emitter threads

## Install

```bash
npm i https://github.com/nicholaswmin/threadpool
```

## Run

Sending `ping`/`pong`s between the primary and 4 threads:

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
```

```bash
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

| name         	| description                                 	| default             	|
|--------------	|---------------------------------------------	|---------------------	|
| `modulePath` 	| file path of per-thread code                	| current file path   	|
| `size`       	| number of threads                           	| available CPU cores 	|
| `env`        	| Environment key-value pairs for each thread 	| undefined           	|

#### `pool.stop()`

Stops the pool, returns an array of thread exit codes

#### `pool.threads`

Array of threads.  

Each thread has an [EventEmitter][ee]-like API for sending messages  
between a thread and the parent/primary process.

See example above.

### Events

#### `thread-error` 

Emitted when a runtime error is encountered in a thread.

## Gotchas 

- Blocking the event loop on startup might cause an internal "ready" handshake 
  to time out.
- Threads with delayed `SIGTERM` handlers after calling `pool.stop()` 
  are [`SIGKILL`][sigkill]-ed.
- Based on [`child_process.fork()`][cp-fork]. Technically it's *multiprocessing* 
  rather than *multithreading*.  

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

[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> tiny thread pool with [`EventEmitter`][ee] IPC

## Install

```bash
npm i https://github.com/nicholaswmin/threadpool
```

## Example

messaging between the primary and 4 threads:

```js
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

#### `new Threadpool(path, size, env)`

Creates a pool.  


| name         	| description                         | default         	 |
|--------------	|------------------------------------ |-----------------	 |
| `path`      	| thread file path                    | current file path  |
| `size`       	| number of threads                   | available cores    |
| `env`        	| thread environment key-value pairs  | current env.    	 |

#### `pool.start()`

Starts the pool and returns it.

#### `pool.stop()`

Stops the pool and returns an array of thread [exit codes][ecodes].

#### `pool.threads`

Array of threads.  

Each thread has an [EventEmitter][ee]-like API for sending messages between a 
thread and the primary process.

#### `thread.on(eventName, callbackFn)`

Listen for a thread event.  

#### `thread.emit(eventName, data)`

Emit an event to the thread.

### Events

#### `thread-error` 

Emitted when a runtime error is encountered in a thread.

## Primary API

The exported `primary`, meant to be used in the thread file, is 
an [EventEmitter][ee] which allows sending/receiving of `thread`-to-`primary`
messages.

#### `primary.on(eventName, callbackFn)`

Listen for a primary event.  

#### `primary.emit(eventName, data)`

Emit an event to the primary.

## Gotchas 

- Blocking the event loop on startup will trip a thread `SIGKILL`.
- Delayed cleanups in `SIGTERM` handlers will trip a thread `SIGKILL`.
- Dead threads cause the entire process to exit with `code: 1`.
- Based on [`child_process.fork()`][cp-fork] so technically 
  it's *multiprocessing* rather than *multithreading*.  

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
[ee]: https://nodejs.org/docs/latest/api/events.html#emitteremiteventname-args
[ecodes]: https://en.wikipedia.org/wiki/Exit_status
[mprocessing]: https://en.wikipedia.org/wiki/Multiprocessing
[nicholaswmin]: https://github.com/nicholaswmin
[license]: https://spdx.org/licenses/MIT-0.html

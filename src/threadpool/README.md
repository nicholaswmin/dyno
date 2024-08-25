[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> thread pool with robust startup/shutdown, plus an [`EventEmitter`][ee] [IPC]

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


| name         	| description                         | default         	   |
|--------------	|------------------------------------ |--------------------  |
| `path`      	| thread file path                    | current file path    |
| `size`       	| number of threads                   | available cores      |
| `env`        	| thread environment key-value pairs  | current [env.][env]	 |

#### `async pool.start()`

Starts the pool and returns it.

#### `async pool.stop()`

Stops the pool and returns an array of thread [exit codes][ecodes].  

#### `pool.ping(data)`

Emits a `ping` event to a thread, in round-robin

| name         	| description           | default         	   |
|--------------	|---------------------- |--------------------  |
| `data`      	| optional event data   | `{}`                 |

#### `pool.threads`

Array of running threads.  

#### `Event`: `'thread-error'` 

Emitted when a runtime error is encountered in a thread.

## Thread API

#### `thread.on(eventName, listenerFn)`

Listen for events emitted from the thread.

#### `thread.off(eventName, listenerFn)`

Remove the listener of a given event.

#### `thread.emit(eventName, data)`

Emit an event to the thread.

## Primary API

> The exported `primary` is meant to be used in the thread file.  
>
> It's an [EventEmitter][ee] which allows sending/receiving of 
*thread-to-primary* messages.

#### `primary.on(eventName, listenerFn)`

Listen for events emitted from the primary.

#### `primary.emit(eventName, data)`

Emit an event to the primary.

## Gotchas 

- [Blocking the event loop][ee-block] on startup will trip a thread `SIGKILL`.
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

Run `ping`/`pong` example:

```bash 
node --run ping-pong
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

The [MIT-0][license] License 


[test-badge]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml/badge.svg
[test-url]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml
[dep-badge]: https://img.shields.io/badge/dependencies-0-b.svg
[dep-url]: https://blog.author.io/npm-needs-a-personal-trainer-537e0f8859c6

[ipc]: https://en.wikipedia.org/wiki/Inter-process_communication
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[env]: https://nodejs.org/api/process.html#processenv
[ee]: https://nodejs.org/docs/latest/api/events.html#emitteremiteventname-args
[ecodes]: https://en.wikipedia.org/wiki/Exit_status
[ee-block]: https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
[mprocessing]: https://en.wikipedia.org/wiki/Multiprocessing
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> tiny thread pool with [ergonomic][ee] [IPC]

## Install

```bash
npm i https://github.com/nicholaswmin/threadpool
```

## Example

> messaging between the primary and 4 threads:

```js
// primary.js

import { Threadpool } from '@nicholaswmin/threadpool'

const pool = new Threadpool('thread.js', 4)

await pool.start()

pool.on('pong', () => {
  console.log('🏓 pong')
  pool.emit('ping')
})

pool.emit('ping')
```

and:

```js
// thread.js 

import { primary } from '@nicholaswmin/threadpool'

primary.on('ping', () => {
  console.log('ping 🏓')

  setTimeout(() => primary.emit('pong'), 100)
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


#### `await pool.start()`

Starts the pool.

#### `await pool.stop()`

Sends a [`SIGTERM`][signals] signal to each thread.

Returns array of [exit codes][ecodes].  

#### `pool.on(eventName, listenerFn)`

Listens for an emitted event, across all threads.

#### `pool.once(eventName, listenerFn)`

`@TODO`

#### `pool.off(eventName, listenerFn)`

Removes a listener of a given event, across all threads.

#### `pool.emit(eventName, data)`

Emits an event to a single thread, chosen in [round-robin][rr].

### Events

#### `'thread-error'` 

Emitted when a runtime error is encountered in a thread.

## Thread API

#### `thread.pid`

Thread's [Process ID][pid]

#### `thread.alive`

`true` if thread is running, `false` otherwise

#### `thread.dead`

`true` if thread has tereminated, `false` otherwise

#### `thread.exitCode`

- `null`: thread is alive
- `0`: exited with zero 
- `1`: thread threw exception or killed with any signal other than `SIGTERM`.

## Primary API

> Exported `primary` is an [EventEmitter][ee] for *thread -> primary* messaging.    

> Meant to be used in the thread file.

#### `primary.on(eventName, listenerFn)`

Listen for events emitted from the primary.

#### `primary.emit(eventName, data)`

Emit an event to the primary.

## Graceful termination

Threads can listen for `SIGTERM` and perform [graceful exit][grace] cleanups,
like so:

```js
// thread.js 

import { primary } from '@nicholaswmin/threadpool'

primary.on('ping', () => {
  console.log('ping 🏓')

  setTimeout(() => primary.emit('pong'), 100)
})

process.once('SIGTERM', () => {
  // shut down DB connection ...
  // shut down server ...
  
  process.exit(0)
})
```

## Gotchas 

- Threads which [block the event loop][ee-block] or delay their termination 
  are issued a [`SIGKILL`][signals], after a set timeout.
- Runtime exceptions trigger a `stop()`; a shutdown of all running threads.
- Based on [`fork()`][fork] so technically it's [*multi-processing*][child-p],
  with each "thread" being an isolated [V8][v8] instance. 

## Test 

```bash 
NODE_ENV=test node --run test
```

### Coverage 

```bash
NODE_ENV=test node --run test:coverage
```

### Example

> Run `ping`/`pong` example

```bash 
node --run example
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

[MIT "No attribution" License][license] 


[test-badge]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml/badge.svg
[test-url]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml
[dep-badge]: https://img.shields.io/badge/dependencies-0-b.svg
[dep-url]: https://blog.author.io/npm-needs-a-personal-trainer-537e0f8859c6

[ipc]: https://en.wikipedia.org/wiki/Inter-process_communication
[fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[env]: https://nodejs.org/api/process.html#processenv
[ee]: https://nodejs.org/docs/latest/api/events.html#emitteremiteventname-args
[ecodes]: https://en.wikipedia.org/wiki/Exit_status
[node-signals]: https://nodejs.org/api/process.html#signal-events
[signals]: https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html
[pid]: https://en.wikipedia.org/wiki/Process_identifier
[ee-block]: https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
[rr]: https://en.wikipedia.org/wiki/Round-robin_scheduling
[grace]: https://en.wikipedia.org/wiki/Graceful_exit
[child-p]: https://en.wikipedia.org/wiki/Child_process
[v8]: https://v8.dev/

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> thread pool with [ergonomic IPC](#messaging)

## Install

```bash
npm i https://github.com/nicholaswmin/threadpool
```

## Example

> messaging between the [primary][parent-proc] and `4` threads:

```js
// primary.js

import { Threadpool } from '@nicholaswmin/threadpool'

const pool = new Threadpool('thread.js', 4)

await pool.start()

pool
  .on('pong', () => {
    console.log('🏓 pong')
    pool.emit('ping')
  })
  .emit('ping')
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

then:

```bash
node primary.js
```

logs:

```bash
# ping 🏓
# 🏓 pong
# ping 🏓
# 🏓 pong
# ...
```

## API

#### `new Threadpool(path, size, env)`

Creates a pool.  

| name         | type     | description              | default               |
|--------------|----------|--------------------------|-----------------------|
| `path`       | `String` | file path of thread code | current path          |
| `size`       | `Number` | number of threads        | available cores       |
| `env`        | `Object` | Thread env. variables    | primary `process.env` |


### Start/Stop

#### `await pool.start()`

Starts the pool.

#### `await pool.stop()`

Sends a [`SIGTERM`][signals] signal to each thread.

Returns array of [exit codes][ecodes].  


### Messaging

> `primary-to-thread` [IPC][ipc]:

#### `pool.on(name, listener)`

Listens for an emitted event, across all threads.

| name       | type       | description       |
|------------|------------|-------------------|
| `name`     | `String`   | name of event     |
| `listener` | `Function` | callback function |

#### `pool.once(name, listener)`

Listens for an emitted event once, across all threads.  
As soon as the listener fires it is removed.

#### `pool.off(name, listener)`

Removes a listener of a given event, across all threads.

#### `pool.removeAllListeners(name)`

Removes all listeners of a given event, across all threads.

#### `pool.emit(name, data)`

Sends the event to a *single* thread, chosen in [round-robin][rr].


#### `pool.broadcast(name, data)`

Sends the event to *every* thread, in [fan-out][fanout]


### Emitted Events

#### `'pool-error'` 

Emitted if an uncaught error is thrown in a thread.    
The error is provided as an `Error` in a `listener` argument.

A shutdown is attempted before emitting this event.   

If the shutdown fails, the `Error` instance will contain the shutdown error 
and the `error.cause` will contain the originating thread error.


## Thread API

#### `thread.pid`

Thread's [Process ID][pid]

#### `thread.exitCode`

- `null`: is alive
- `0`: exited with `exit-code: 0` 
- `1`: threw uncaught exception or killed with any signal other than `SIGTERM`.


## Primary API

> Meant to be used in the thread file, `thread-to-primary` [IPC][ipc]

#### `primary.on(name, listener)`

Listen for events emitted from the primary.

#### `primary.emit(name, data)`

Emit an event to the primary.

## Graceful exits

Threads can listen for `SIGTERM` and perform [graceful exit][grace] cleanups,
like so:

```js
// thread.js 

import { primary } from '@nicholaswmin/threadpool'

// main code ...

process.once('SIGTERM', () => {
  // cleanups
  
  process.exit(0)
})
```

### Timeouts

Threads which [block the event loop][ee-block] or delay their termination are 
issued a [`SIGKILL`][signals] signal, after a set timeout.

The timeouts are in `ms` and can be set like so:

```js
// primary.js

import { Threadpool } from '@nicholaswmin/threadpool'

Threadpool.readyTimeout = 1000
Threadpool.killTimeout  = 1000

const pool = new Threadpool('thread.js')

// main code ...
```

## Gotchas 

- Runtime exceptions trigger a shutdown of all running threads.
- Based on [`fork()`][fork] so technically it's [multi-processing][child-p],
  not multithreading.   
  Each "thread" is an isolated [V8][v8] instance. 

## Test 

```bash 
NODE_ENV=test node --run test
```

### Coverage 

```bash
NODE_ENV=test node --run test:coverage
```

## Benchmark

> Run a [`ping`/`pong` benchmark][benchmark]

```bash 
node --run benchmark -- --size=8 --bytes=300 --type=broadcast
```

where:

- `--size` : `number` : thread count.
- `--data` : `number` : bytes of `data` payload per `ping` event.
- `--type` : `string` : dispatch type, can be either:
  [`broadcast`](#pool.broadcast) or [`emit`](#pool.emit).

logs:

```text
🏓  Benchmark 

┌────────────┬─────────┬─────────────────┬──────────────┬──────────────┐
│ type       │ threads │ payload (bytes) │ pings/second │ pongs/second │
├────────────┼─────────┼─────────────────┼──────────────┼──────────────┤
│'broadcast' │ 8       │ 300             │ 44091        │ 44091        │
┴────────────┴─────────┴─────────────────┴──────────────┴──────────────┘

Elapsed: 9 seconds
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

[The MIT-0 License][license]


[test-badge]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml/badge.svg
[test-url]: https://github.com/nicholaswmin/threadpool/actions/workflows/test.yml
[dep-badge]: https://img.shields.io/badge/dependencies-0-b.svg
[dep-url]: https://blog.author.io/npm-needs-a-personal-trainer-537e0f8859c6

[ipc]: https://en.wikipedia.org/wiki/Inter-process_communication
[parent-proc]: https://en.wikipedia.org/wiki/Parent_process
[fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[env]: https://nodejs.org/api/process.html#processenv
[ee]: https://nodejs.org/docs/latest/api/events.html#emitteremiteventname-args
[ecodes]: https://en.wikipedia.org/wiki/Exit_status
[node-signals]: https://nodejs.org/api/process.html#signal-events
[signals]: https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html
[pid]: https://en.wikipedia.org/wiki/Process_identifier
[ee-block]: https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
[rr]: https://en.wikipedia.org/wiki/Round-robin_scheduling
[fanout]: https://en.wikipedia.org/wiki/Fan-out_(software)#Message-oriented_middleware
[grace]: https://en.wikipedia.org/wiki/Graceful_exit
[child-p]: https://en.wikipedia.org/wiki/Child_process
[v8]: https://v8.dev/

[benchmark]: ./.github/bench
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

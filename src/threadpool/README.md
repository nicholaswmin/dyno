[![dep-url][dep-badge]][dep-url] [![test-url][test-badge]][test-url] 

# :thread: threadpool

> tiny thread pool with an [`EventEmitter`][ee]-like [IPC]

## Install

```bash
npm i https://github.com/nicholaswmin/threadpool
```

## Example

messaging between the primary and 4 threads:

```js
// primary.js

import { Threadpool } from '@nicholaswmin/threadpool'

const pool = new Threadpool('thread.js', 4)

for (const thread of await pool.start())
  thread.on('pong', () => {
    console.log('🏓 pong')

    thread.emit('ping')
  })

pool.threads.at(0).emit('ping')
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


#### `pool.threads`

Array of `threads`. 

#### `async pool.start()`

Starts the pool.

Returns array of `threads`.

#### `async pool.stop()`

Sends a [`SIGTERM`][sigterm] signal to each thread.

Returns array of [exit codes][ecodes].  

#### `pool.ping()`

Emits a `'ping'` event to a thread, in [round-robin][rr]. 

#### `Event`: `'thread-error'` 

Emitted when a runtime error is encountered in a thread.

## Thread API

#### `thread.pid`

Thread's [Process ID][pid]

#### `thread.alive`

`true` if process is running, `false` otherwise

#### `thread.alive`

`true` if process is dead, `false` otherwise

#### `thread.exitCode`

- `null` if thread is running
- `0` if exited with zero 
- `1` if thread threw exception or killed with anything other than `SIGTERM`.

#### `thread.on(eventName, listenerFn)`

Listen for events emitted from the thread.

#### `thread.off(eventName, listenerFn)`

Remove the listener of a given event.

#### `thread.emit(eventName, data)`

Emit an event to the thread.

## Primary API

> Exported `primary` is an [EventEmitter][ee] for *thread -> primary* messaging.    

> Meant to be used in the thread file.

#### `primary.on(eventName, listenerFn)`

Listen for events emitted from the primary.

#### `primary.emit(eventName, data)`

Emit an event to the primary.

## Gotchas 

- Threads which [block their startup][ee-block] or 
  [delay their termination][node-signals] are issued a [`SIGKILL`][signals] 
  after a set timeout.
- Runtime exceptions trigger a `stop()`; a shutdown of all running threads.
- Based on [`fork()`][fork] so technically it's [*multi-processing*][child-p],
  each "thread" being an isolated [V8][v8] instance. 

## Test 

```bash 
node --run test
```

### Coverage 

```bash
node --run test:coverage
```

### Example

```bash 
node --run pingpong
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
[zombie]: https://en.wikipedia.org/wiki/Zombie_process
[child-p]: https://en.wikipedia.org/wiki/Child_process
[v8]: https://v8.dev/

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

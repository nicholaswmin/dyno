[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Quickstart](#install)
  + [Parameters](#test-parameters)
* [The Process Model](#the-process-model)
* [Measurements](#the-measurements-systems)
* [Plotting](#plotting)
* [Gotchas](#gotchas)
  + [Avoiding self-forking](#avoiding-self-forking)
    - [Using hooks](#using-hooks)
    - [Using a task file](#using-a-task-file)
* [Tests](#tests)
* [Misc.](#misc)
* [Authors](#authors)
* [License](#license)

## Overview

Loops a *task* function, for a given *duration* - across multiple threads.

A test is deemed succesful if it ends without creating a *cycle backlog*.

```js
// benchmark.js
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 
  // <benchmarked-code>

  function fibonacci(n) {
    return n < 1 ? 0
    : n <= 2 ? 1 : fibonacci(n - 1) + fibonacci(n - 2)
  }

  fibonacci(35)

  // </benchmarked-code>
}, {
  // test parameters
  parameters: { 
    cyclesPerSecond: 100, threads: 4, durationMs: 5 * 1000
  },
  
  // log live stats
  onTick: ({ main, tasks }) => {    
    console.clear()
    console.table(main)
    console.table(tasks)
  }
})
```

run it: 

```bash
node benchmark.js
```

logs:

```js
cycle stats

┌─────────┬────────┬───────────┬─────────┐
│ uptime  │ issued │ completed │ backlog │
├─────────┼────────┼───────────┼─────────┤
│ 4       │ 100    │ 95        │ 5       │
└─────────┴────────┴───────────┴─────────┘

average timings/durations, in ms

┌─────────┬───────────┬────────┐
│ thread  │ evt_loop  │ cycle  │
├─────────┼───────────┼────────┤
│ '46781' │ 10.47     │ 10.42  │
│ '46782' │ 10.51     │ 10.30  │
│ '46783' │ 10.68     │ 10.55  │
│ '46784' │ 10.47     │ 10.32  │
└─────────┴───────────┴────────┘
```

## Install

```bash
npm i @nicholaswmin/dyno
```

## Generate benchmark

```bash 
npx init
```

> creates a preconfigured sample `benchmark.js`.

Run it:

```bash
node benchmark.js
``` 

### Structure

```js
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  // add benchmarked task

}, {
  parameters: { 
    // add test parameters
  },
  
  onTick: ({ primary, threads }) => {    
    // build logging from the provided measurements
  }
})
```

### Test parameters

| name            	| type     	| default    | description                 	|
|-----------------  |----------	|----------- |----------------------------- |
| `cyclesPerSecond` | `Number` 	| `20`       | global cycle issue rate     	|
| `durationMs`      | `Number` 	| `10000`    | how long the dyno should run |
| `threads`         | `Number` 	| `auto` 	   | number of spawned threads    |

> these parameters are user-configurable on test startup.

## The process model

The benchmarker runs everything in multiple, concurrently-running 
*`threads`*.

There's always:

- a single `primary thread` 
- a number of `task threads`, spawned & controlled by the primary.

The `primary thread` spawns the benchmarked code, the `task`,
in its own isolated `task thread`.

The primary then starts issuing `cycles` to each task thread, 
using [round-robin scheduling][rr] at a pre-configured cycle-per-second rate.   
A cycle command simply tells a thread to execute it's code and report 
it's duration.

This is how it would look, if sketched out.

> assume `fib()` is the code-under-test, a usual fibonacci function

```js
Primary 0: cycles issued: 100, finished: 93, backlog: 7
│
├── Thread 1
│   └── function fib(n) {
│       ├── return n < 1 ? 0
│       └── : n <= 2 ? 1 : fib(n - 1) + fib(n - 2)}
├── Thread 2
│   └── function fib(n) {
│       ├── return n < 1 ? 0
│       └── : n <= 2 ? 1 : fib(n - 1) + fib(n - 2)}
└── Thread 3
    └── function fib(n) {
        ├── return n < 1 ? 0
        └── : n <= 2 ? 1 : fib(n - 1) + fib(n - 2)}
```

### The test

Threads should execute their task faster than the time it takes for the next 
cycle command to come through, otherwise they start accumulating 
a `cycle backlog`.

When that happens, the test stops; & the configured cycle rate is 
deemed as the current *breaking point* of that code.

As an example, a benchmark configured to 
use `threads: 4` & `cyclesPerSecond: 4`, would need to have it's benchmarked 
task execute in `< 1 second` to avoid accumulating a backlog. 

## The measurements system

The benchmarker comes with a flexible measurement system which can help
in diagonsing bottlenecks. 

The measurements are provided as arguments to the `onTick` callback.

```js
// ...
onTick: ({ primary, threads }) => {    
  
}
```

Every value, default or custom, is tracked as a [Histogram][hgram], 
so every recorded value has tracked `min`, `mean(avg)`, `max` properties.

Some measurements are recorded by default, while others can be 
self-recorded.

### `primary`  
> contains primary stats about the test itself

By default, it records the following:


| name        | description               |
|-------------|---------------------------|
| `issued`    | count of issued cycles    |
| `completed` | count of completed cycles |
| `uptime`    | seconds since startup     |

### `threads`  
> contains the `task threads` 

> lists the task threads, with each thread having it's own 
> list of histograms.

By default, it records the following:

| name               | description               |
|--------------------|---------------------------|
| `cycles`           | cycle timings             |
| `evt_loop`         | event loop lag/timings    |
| *anything custom*  | anything user-defined     |

The measurements argument structure looks like so:

```js
Primary
├── Histogram: cycle stats
│   └── `min`, `mean`, `max` ...
└── Histogram: uptime 
    └── `min`, `mean`, `max` ...

Threads
│
├── Thread 1
│   ├── Histogram: cycle
│   │  └── `min`, `mean`, `max` ...
│   ├── Histogram: evt_loop
│   │  └── `min`, `mean`, `max` ...
│   └── Histogram: custom-user-value
│       └── `min`, `mean`, `max` ...
│
└── Thread 2
    ├── Histogram: cycle
    │   └── `min`, `mean`, `max` ...
    ├── Histogram: evt_loop
    │   └── `min`, `mean`, `max` ...
    └── Histogram: custom-user-value
        └── `min`, `mean`, `max` ...
```

### Custom timings

> In the following example, `performance.timerify` is used to wrap a 
> function named `fibonacci`.  
> This automatically creates a new `Histogram` with the same name 
> then records the timings values.

```js
await dyno(async function cycle() { 
  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)
}, {
  onTick: ({ primary, threads }) => {    
    console.log(threads.first()?.toList())
  }
})

// logs 
// { name: 'fibonacci', count: 4, min: 3, max: 7, mean: 4, snapshots: [] }
// { name: 'cycle', count: 5, min: 4, max: 8, mean: 6, snapshots: [] }
// ...
....
```

> There's no need to setup anything, like a `PerformanceObserver`, 
> for listening to `performance,timerify` updates. This is done internally.

### Plotting timings

The [`console.plot`][console-plot] module can be used to plot a *timeline*, 
using the collected `snapshots`.

The following example benchmarks 2 `sleep` functions & plots their 
timings as an ASCII chart

```js
// plotting the timings
// Requires: 
// `npm i @nicholaswmin/console-plot --no-save`

import { dyno } from '@nicholaswmin/dyno'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 
  
  // sleep one
  await performance.timerify(async function sleepTwo() {
    return new Promise(res => setTimeout(res, Math.random() * 20))
  })()
  
  // sleep two
  await performance.timerify(async function sleepOne() {
    return new Promise(res => setTimeout(res, Math.random() * 20))
  })()

}, {
  parameters: { 
    cyclesPerSecond: 50, 
    durationMs: 20 * 1000
  },
  
  onTick: ({ main, tasks, snapshots }) => {   
    console.clear()
    console.table(main)
    console.table(tasks)
    console.plot(snapshots, {
      title: 'Timings timeline',
      subtitle: 'average durations, in ms',
      height: 15,
      width: 100
    })
  }
})
```

which logs: 

```js
  Timings timeline

  -- cycle  -- sleepOne  -- sleepTwo

  21.57 ┤     ╭╮                                                                     
  20.33 ┤  ╭──╯╰─────╮                                                               
  19.09 ┤ ╭╯         ╰──╮ ╭╮╭──╮╭──╮         ╭╮╭───╮╭────────────────────────── 
  17.86 ┤ │             ╰─╯╰╯  ╰╯  ╰─────────╯╰╯   ╰╯                                
  16.62 ┤ │                                                                          
  15.38 ┤ │                                                                          
  14.14 ┤ │                                                                          
  12.90 ┤ │╭╮ ╭╮╭╮╭──╮                                                               
  11.67 ┤╭╯│╰─╯╰╯╰╯  ╰─╮                                     ╭╮                      
  10.43 ┤│╭╯╭╮╭╮       ╰───╮╭─────╮        ╭─────────────────╯╰────────────────
   9.19 ┤││││╰╯╰╮╭───╮╭────╰╯─────╰──────────────────────────────────────────── 
   7.95 ┼╯│╰╯   ╰╯   ╰╯                                                              
   6.71 ┤││                                                                          
   5.48 ┼─╯                                                                          
   4.24 ┤│                                                                           
   3.00 ┼╯                                                                           

  average durations, in ms
  
  last: 100 items
```

## Gotchas

### Avoid self-forking

Single-file, self-contained, yet multithreaded benchmarks suffer a 
caveat where any code that exists *outside* the `dyno` block 
is *also* run in multiple threads, as if it were a task.

The benchmarker is not affected by this, in fact it's designed around it,  
however it can create issues if you need to run code after the `dyno()` 
resolves/ends - or when running it as a part of an automated test suite.

> In this example, `'done'` is logged `3` times instead of `1`: 

```js
import { dyno } from '@nicholaswmin/dyno'

const result = await dyno(async function cycle() { 
  // task code, expected to run 3 times ...
}, { threads: 3 })

console.log('done')
// 'done'
// 'done'
// 'done'
```

#### Using hooks

To work around this, the `before`/`after` hooks can be used for setup and
teardown, like so:

```js
await dyno(async function cycle() { 
  console.log('task')
}, {
  parameters: { durationMs: 5 * 1000, },

  before: async parameters => {
    console.log('before')
  },

  after: async (parameters, { main, tasks, snapshots }) => {
    console.log('after')
  }
})

// "before"
// ...
// "task"
// "task"
// "task"
// "task"
// ...  
// "after"
```

#### Using a task file

Alternatively, the *task* function can be extracted to it's own file.

```js
// task.js
import { task } from '@nicholaswmin/dyno'

task(async function task(parameters) {
  // task code ...

  // `benchmark.js` test parameters are
  // available here.
})
```

then referenced as a path in `benchmark.js`:

```js
// benchmark.js

import { join } from 'node:path'
import { dyno } from '@nicholaswmin/dyno'

const result = await dyno(join(import.meta.dirname, './task.js'), { 
  threads: 5
})

console.log('done')
// 'done'
```

> This is the preferred method when running this as part of a test suite. 

## Tests

install deps:

```bash
npm ci
```

unit & integration tests:

```bash
npm test
```

test coverage:

```bash
npm run test:coverage
```

meta checks:

```bash
npm run checks
```

## Misc

generate sample:

```bash
npx init
```

generate [Heroku-deployable][heroku] benchmark:

```bash
npx init-cloud
```

## Contributors

Todos are available [here][todos]

### Scripts

update `README.md` code snippets:

```bash
npm run examples:update
```

> source examples are located in: [`/bin/example`](./bin/example)

## Authors

[@nicholaswmin][nicholaswmin]

## License

[MIT-0 License][license]

<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/test:unit.yml

[coverage-badge]: https://coveralls.io/repos/github/nicholaswmin/dyno/badge.svg?branch=main
[coverage-report]: https://coveralls.io/github/nicholaswmin/dyno?branch=main

[codeql-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml/badge.svg
[codeql-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml

[deps-badge]: https://img.shields.io/badge/dependencies-0-b.svg
[deps-report]: https://github.com/nicholaswmin/dyno/edit/main/README.md

<!--- Content -->

[heroku]: https://heroku.com
[rr]: https://en.wikipedia.org/wiki/Round-robin_scheduling
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[opt-chain]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[hgram]: https://en.wikipedia.org/wiki/Histogram
[hgrams]: https://nodejs.org/api/perf_hooks.html#class-histogram
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

[mean]: https://en.wikipedia.org/wiki/Mean

<!--- Basic -->

[console-plot]: https://github.com/nicholaswmin/console-plot
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
[todos]: ./.github/TODO.md

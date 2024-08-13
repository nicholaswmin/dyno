[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Quickstart](#install)
  + [Parameters](#test-parameters)
* [The Process Model](#the-process-model)
* [Measurements](#measurements)
* [Plotting](#plotting)
* [Gotchas](#gotchas)
  + [`onTick` returns `undefined`](#ontick-returning-undefined)
  + [`missing custom measurements`](#missing-custom-measurements`)
  + [self-forking files](#avoiding-self-forking)
    - [Use hooks](#using-hooks)
    - [Use a task file](#fallback-to-using-a-task-file)
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
  parameters: { 
    cyclesPerSecond: 100, threads: 4, durationMs: 5 * 1000
  },
  
  // log live stats
  onTick: ({ primary, threads }) => {    
    console.clear()
    console.table(primary.toUnit('mean'))
    console.table(threads.toUnit('mean'))
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

### Glosssary

#### `primary thread`

The main process. Orchestrates the test and the spawned `task threads`.

#### `task thread`

The benchmarked code, running in its own separate process.

Receives `cycle` commands from the primary, executes it's code and records 
its timings.

#### `cycle`

A command that signals a `task thread` to execute it's code. 

#### `cycle rate`

The rate at which the primary sends `cycle` commands to the `task threads`

#### `cycle timing`

Amount of time it takes a `task thread` to execute it's own code

#### `cycle backlog`

Count of issued `cycle` commands that have been issued/sent but not 
executed yet.   

This is how the process model would look, if sketched out.  

```js
// assume `fib()` is the benchmarked code

Primary 0: cycles issued: 100, finished: 93, backlog: 7
│
│
├── Thread 1
│   └── function fib(n) {
│       ├── return n < 1 ? 0
│       └── : n <= 2 ? 1 : fib(n - 1) + fib(n - 2)}
│
├── Thread 2
│   └── function fib(n) {
│       ├── return n < 1 ? 0
│       └── : n <= 2 ? 1 : fib(n - 1) + fib(n - 2)}
│
└── Thread 3
    └── function fib(n) {
        ├── return n < 1 ? 0
        └── : n <= 2 ? 1 : fib(n - 1) + fib(n - 2)}
```

### The test

Task threads must execute their task faster than the time it takes for 
the next cycle command to come through, otherwise they will 
start accumulating a `cycle backlog`.

When that happens, the test stops; & the configured `cycle rate` is 
deemed as the current *breaking point* of that code.

An example:

> A benchmark configured to use `threads: 4` & `cyclesPerSecond: 4`. 

Each `task thread` must execute its own code in `< 1 second` since this 
is the rate at which it receives `cycle` commands.

## Measurements

The benchmarker comes with a statistical measurement system  
which aids in diagnosing bottlenecks.

Some measurements are recorded by default;   
others can be recorded by the user within a task thread.

Collected measurements are continuously provided as arguments   
to the `onTick` callback.

```js
// ...
onTick: ({ primary, threads }) => {    
  console.log('measurement updated!')
}
```

### `primary`  

> contains primary stats about the test itself

By default, it records the following:

| name        | description               |
|-------------|---------------------------|
| `issued`    | count of issued cycles    |
| `completed` | count of completed cycles |
| `backlog`   | size of cycles backlog    |
| `uptime`    | seconds since test start  |

### `threads`  

> contains all `task threads`, 
> each having it's own list of `Histograms`.

> User-defined measurements will appear here.

By default, it records the following:

| name               | description               |
|--------------------|---------------------------|
| `cycles`           | cycle timings             |
| `evt_loop`         | event loop lag/timings    |

The measurements data structure looks like this:

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

Every value, default or custom, is tracked as a [Histogram][hgram], 
so every recorded value has tracked `min`, `mean(avg)`, `max` etc properties.

This is necessary because the [`statistical mean`][mean] is required to 
make decent approximations about runtime performance, since it provides a 
de-noised and normalised measurement of runtime performance.

### Custom timings

Custom measurements can be recorded with either:

- [`performance.timerify`][timerify]
- [`performanc.measure`][measure]

both of them are native extensions of the [User Timing APIs][perf-api],
available in Node.js since `v17`.

They do not require any setup other than using them to record a value.

The stats collector listens for usage of the above APIs and automatically 
records the values in a Histogram, which is then attached to it's 
corresponding `task thread`. 

The histogram is made available for logging 
via the `threads` property of `onTick`.

> In the following example, `performance.timerify` is used to 
> instrument a function named `fibonacci`.  

```js
// performance.timerify example

import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { 
    cyclesPerSecond: 20
  },
  
  onTick: ({ threads }) => {    
    console.log(threads.first()?.toList())
  }
})

// logs 

// { name: 'cycle', min: 6, max: 12, mean: 8, stddev: 2, snapshots: [...] },
// { name: 'fibonacci', min: 3, max: 6, mean: 4, stddev: 1, snapshots: [...] },
// ....
```

### Measurement extractor methods

There's a couple of utilities for extracting measurements, however, 
these are badly designed and only meant to help in creating 
concise README examples.

#### `threads.first()`

return the first task thread.

#### `threads.toUnit(unit)`

reduce to a list of histogram names and one specific histogram `unit`. 

i.e: `threads.toUnit('max')` returns a list of the max recorded durations 
for all histograms, across all threads.  

#### `primary.toUnit(unit)` 

same as above but for the `primary`.

#### `threads.toSnapshotUnit(unit)` 

instead of a value, it returns the snapshots of values for that `unit`.

### Plotting timings

The tracked histograms contain *snapshots* of their past values. 

This allows plotting a timeline of the measurements, 
using the [`console.plot`][console-plot] module.

> The following example benchmarks 2 `sleep` functions 
> & plots their timings as an ASCII chart

```js
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
  parameters: { cyclesPerSecond: 50, durationMs: 20 * 1000 },

  onTick: ({ threads }) => {
    console.clear()
    console.plot(threads.first()?.toSnapshotUnit('mean'), {
      title: 'Timings timeline', subtitle: 'average durations, in ms',
      height: 15, width: 100
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

### `onTick` returning undefined

Threads and their histograms aren't synchronously available.  
They spin up and become available as the runner spins up.

Use [optional chaining][opt] to avoid `ReferenceError`s.

change this:

```js
onTick: ({ threads }) => {    
  console.log(threads.first().toList())
}
```

to this:

```js
onTick: ({ threads }) => { 
  console.log(threads.first()?.toList())
}
```

### missing custom measurements

Using anonymous lambdas/arrow functions means the stats collector 
has no function name to use for the measurement.

By their own definition, they are anonymous;

Change this:

```js
const foo = () => {
  // test code
}

performance.timerify(foo)()
```

to this:

```js
function foo() {
  // test code
}

performance.timerify(foo)()
```

### self-forking files

The benchmark file self-forks itself. 👀 

This means that any code that exists *outside* the `dyno` block will *also* 
run in multiple threads.

This is a design tradeoff, made to provide the ability to create simple, 
single-file benchmarks.

This can create issues if you intent to run code after the `dyno()` 
resolves/ends; or when running this as part of an automated test suite.

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

#### Fallback to using a task file

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

> This should be the preferred method when running this as part 
> of a test suite. 

### Not a load-testing tool

This is not a stress-testing tool.    
Stress-tests are far more complex and require a near-perfect 
replication of an actual production environment.

This is a prototyping tool that helps testing whether some prototype idea is 
worth proceeding with or if it has unworkable performance issues. 

It's original purpose was for benchmarking a module prototype that 
heavily interacts with `Redis`. 

It's not meant for side-to-side benchmarking of synchronous code either,
[Google's Tachometer][tachometer] might be a better fit there.

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
[opt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
[mean]: https://en.wikipedia.org/wiki/Mean
[tachometer]: https://github.com/google/tachometer?tab=readme-ov-file
<!--- Basic -->

[console-plot]: https://github.com/nicholaswmin/console-plot
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
[todos]: ./.github/TODO.md

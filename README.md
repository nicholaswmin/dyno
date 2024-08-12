[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Install](#install)
* [Quickstart](#generate-benchmark)
* [How it works](#how-it-works)
  + [Test parameters](#test-parameters)
* [Plotting](#plotting)
* [Gotchas](#gotchas)
  + [Avoiding self-forking](#avoiding-self-forking)
    - [Using hooks](#using-hooks)
    - [Using a task file](#using-a-task-file)
    - [Using a task file](#using-an-env-var)
* [Tests](#tests)
* [Misc.](#misc)
* [Authors](#authors)
* [License](#license)

## Overview

It loops a *task* function, for a given *duration*, across multiple threads.

A test is succesful if it ends without creating a *cycle backlog*.

```js
// benchmark.js

import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  }

}, {
  parameters: { 
    cyclesPerSecond: 100
  },
  
  onTick: ({ main, tasks }) => {    
    console.clear()
    console.table(main)
    console.table(tasks)
  }
})
```

which logs: 

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

creates a preconfigured sample `benchmark.js`.

Run it with:

```bash
node benchmark.js
``` 

## How it works

Internally, the benchmark spawns a *`primary`* or *`main`* process.   

The primary process then spawns & controls an `x` amount of 
concurrently-running *`tasks`* each having their own copy of the
benchmarked code, running in it's own thread.

The primary then starts issuing `cycles`, using [round-robin scheduling][rr], 
to each thread, at a pre-configured rate.   
A cycle command tells a thread to execute it's code and report it's duration.

A thread is expected to execute it's benchmarked task faster
than the time it takes for it's next cycle command to come through, 
otherwise it risks accumulating a *`cycle backlog`*.

As an example, a benchmark configured to 
use `threads: 4` & `cyclesPerSecond: 4`, would need to have it's benchmarked 
task execute in `< 1 second` to avoid accumulating a backlog. 

The `cyclesPerSecond` rate at which a backlog is created is deemed
to be the absolute breaking point of that piece of code. 

Realistically speaking, it should be considerably lower than that, since 
this benchmark runs everything locally with no network in-between to contribute
to latency.

The `threads` parameter is more or less constant, since it should be set to 
the same number of available physical cores.

### Structure

```js
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  // add benchmarked task

}, {
  parameters: { 
    // add test parameters
  },
  
  onTick: ({ main, tasks, snapshots }) => {    
    // log any of the provided timings, 
    // or create custom ones (see below)
    //
    // this callback is run ~ 30 times per second 
  }
})
```

### Test parameters

| name            	| type     	| default    | description                 	|
|-----------------  |----------	|----------- |----------------------------- |
| `cyclesPerSecond` | `Number` 	| `20`       | global cycle issue rate     	|
| `durationMs`      | `Number` 	| `10000`    | How long the dyno should run |
| `threads`         | `Number` 	| `auto` 	   | Number of spawned threads    |

> these parameters are user-configurable on test startup.

## Custom timings

[`performance.timerify`][timerify] & [`performance.measure`][measure], both
native `User Timing APIs`, can be used to capture custom timings:

```js
// timing a recursive fibonacci function

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
  
  onTick: ({ tasks, snapshots }) => {    
    // custom timings are set in both 
    // `tasks` & `snapshots` as Histograms
    console.clear()
    console.table(tasks)
  }
})
```

which logs:

```js
timings (average, in ms)

┌─────────┬───────────┬────────┬───────────┐
│ thread  │ evt_loop  │ cycle  │ fibonacci │
├─────────┼───────────┼────────┼───────────┤
│ '46781' │ 10.47     │ 10.42  │ 9.01      │
│ '46782' │ 10.51     │ 10.30  │ 9.14      │ 
│ '46783' │ 10.68     │ 10.55  │ 9.18      │
│ '46784' │ 10.47     │ 10.32  │ 9.09      │
└─────────┴───────────┴────────┴───────────┘
```

## Plotting

The [`console.plot`][console-plot] module can be used to plot a *timeline*, 
using the collected `snapshots`.

The following example benchmarks 2 `sleep` functions & plots their 
timings as an ASCII chart

```js
// run: `npm i --no-save @nicholaswmin/console-plot`

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
  
  onTick: ({ snapshots }) => {   
    console.clear()
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

### Avoiding self-forking

Single-file, multithreaded benchmarks suffer from a caveat where any 
code that exists *outside* the `dyno` block is *also* run multiple times.

This is not a problem when benchmarking but can create issues if you 
need to do any work with the results when the `dyno()` resolves/ends.

It's also known to create issues in automated test suites.

In the following example, `'done'` is logged `3` times instead of `1`: 

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
// @TODO
```

#### Using a task file

Alternatively, the *task function* can be extracted into it's own file,
like so:

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
import path from 'node:path'
import { dyno } from '@nicholaswmin/dyno'

const result = await dyno(path.join(import.meta.dirname, './task.js'), { 
  threads: 3
})

console.log('done')
// 'done'
```

This method is actually what is used to test the module itself.

#### Using an env var

Finally, you can use a similar technique as `node:cluster`, 
by using an `env. var` & a conditional to only run code if the 
current process is the primary/main:

```js
// the main process does not have a `THREAD_INDEX` env. var.
const isMain = typeof process.env.THREAD_INDEX === 'undefined'
const result = await dyno(async function cycle() { 
  // task code ...
}, { threads: 3 })

if (isMain) {
  console.log('done')
  // 'done'
}
```

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

> source examples are located in: [`/bin/examples`](./bin/examples)

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

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
[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

<!--- Basic -->

[console-plot]: https://github.com/nicholaswmin/console-plot
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
[todos]: ./.github/TODO.md

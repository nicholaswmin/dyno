[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [overview](#overview)
* [quickstart](#install)
  + [parameters](#test-parameters)
* [glossary](#glossary)
* [test process](#the-test-process)
* [metrics](#metrics)
  - [querying metrics](#querying-metrics)
  - [default metrics](#default-metrics)
  - [recording custom metrics](#recording-custom-metrics)
* [plotting metrics](#plotting)
* [gotchas](#gotchas)
  + [missing custom metrics](#missing-custom-metrics`)
  + [self-forking files](#avoiding-self-forking)
* [tests](#tests)
* [misc.](#misc)
* [authors](#authors)
* [license](#license)

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
  parameters: { cyclesPerSecond: 100, threads: 4, durationMs: 5 * 1000 },
  
  // log live stats
  onTick: log => {    
    console.clear()
    console.table(log().primary().pick('count'))
    console.table(log().threads().pick('mean'))
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
  
  onTick: log => {    
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

## Glossary

#### `primary`

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

### The test process

The `primary` spawns the benchmarked code as `task threads`.

Then, it starts issuing `cycle` commands to each one, in [round-robin][rr],
at a set rate, for a set duration.

A `task thread` must execute it's task faster than the time it takes for 
its next `cycle` command to come through, otherwise it will start accumulating 
a `cycle backlog`.

When that happens, the test stops; the configured `cycle rate` is deemed as 
the current *breaking point* of the benchmarked code.

An example:

> A benchmark configured to use `threads: 4` & `cyclesPerSecond: 4`. 

Each `task thread` must execute its own code in `< 1 second` since this 
is the rate at which it receives `cycle` commands.

## Metrics

The benchmarker comes with a statistical measurement system.

Some metrics are recorded by default; others can be recorded by the user 
within a task thread.

Every recorded value is tracked as a `Metric`, represented as a 
[histogram][hgram] with `min`, `mean`, `max` properties.

This is necessary because only a [statistical method][nd] can shield the test 
results from uncontrollable environmental events, otherwise each test run 
would produce vastly different results.

Timing metrics are collected in *milliseconds*. 

### Querying metrics

Metrics can be queried from the `log` argument of the `onTick` callback.

```js
// ...
onTick: log => {    
  console.log(log().primary()) // primary metrics
  console.log(log().threads()) // task thread metrics 
}
```

#### `.primary()`

metrics of the primary/main.

```js
// log all primary metrics
console.log(log().primary())
```

> **note:** most primary metrics are not *timings*; they are *counters*, 
> so logging anything other than their `.count` property doesnt make any sense.

#### `.threads()`

metrics of the task threads

```js
// log all metric of every task-thread
console.log(log().threads())
```

#### `.pick()` 

get a specific histogram unit, instead of entire histograms.

```js
const avgs = log().threads().pick('mean')
// get only the average for each thread metric

const maxes = log().primary().pick('max')
// get only the 'max' for each primary metric

const snaps = log().primary().pick('snapshots')
// get only the 'snapshots' of the primary
```

> available: `min`, `mean`, `max`, `stdev`, `snapshots`, `count`, `last`
>
> - `stddev`: standard deviation between recorded values  
> - `last`  : last recorded value  
> - `count` : number of recorded values  

#### `.of()` 

reduce a `pick`-ed array to a single value.    

```js
const snapshotsMax = log().primary().pick('snapshots').of('max')
// get a 1-D array of the last 50 'maxes' of the primary
```

> note: only makes sense if it comes after `.pick('snapshots')`:

#### `.metrics()`

get only specific metric(s) 

```js
const loopMetrics = log().threads().metrics('evt_loop', 'fibonacci')
// get only the `evt_loop` and `fibonacci` metrics
```

#### `.sortBy()`

sort by specific metric

```js
const sorted = log().threads().pick('min').sort('cycle', 'desc')
// sort results by descending min 'cycle' durations
```

> available: `desc`, `asc`

#### `.group()`

get result as an object instead of an array

```js
const obj = log().threads().pick('snapshots').of('mean').group()
```

### Default metrics

The following metrics are collected by default:

#### `primary`  

| name        | description               |
|-------------|---------------------------|
| `issued`    | count of issued cycles    |
| `completed` | count of completed cycles |
| `backlog`   | size of cycles backlog    |
| `uptime`    | seconds since test start  |

#### `threads`  

| name               | description         |
|--------------------|---------------------|
| `cycles`           | cycle timings       |
| `evt_loop`         | event loop timings  |

> any user-defined metrics will appear here.

### Recording custom metrics

Custom metrics can be recorded with either:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

both of them are native extensions of the [User Timing APIs][perf-api].

The metrics collector records their timings and attaches the tracked `Metric` 
histogram to its corresponding `task thread`. 

> **example:** instrumenting a function using `performance.timerify`:

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
  parameters: { cyclesPerSecond: 20 },
  
  onTick: log => {    
    console.log(log().threads().metrics().pick('mean'))
  }
})

// logs 
// ┌─────────┬───────────┐
// │ cycle   │ fibonacci │
// ├─────────┼───────────┤
// │ 7       │ 7         │
// │ 11      │ 5         │
// │ 11      │ 5         │
// └─────────┴───────────┘
```

> **note:** the stats collector uses the function name for the metric name,
> so anonymous lambdas/arrow-functions should be avoided.

### Plotting

Each metric contains up to 100 *snapshots* of its past states.

This allows plotting them as a *timeline*, using the 
[`console.plot`][console-plot] module.

> The following example benchmarks 2 `sleep` functions 
> & plots their timings as an ASCII chart

```js
// Requires: 
// `npm i @nicholaswmin/console-plot --no-save`

import { dyno } from '@nicholaswmin/dyno'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 

  await performance.timerify(function sleepRandom1(ms) {
    return new Promise(r => setTimeout(r, Math.random() * ms))
  })(Math.random() * 20)
  
  await performance.timerify(function sleepRandom2(ms) {
    return new Promise(r => setTimeout(r, Math.random() * ms))
  })(Math.random() * 20)
  
}, {

  parameters: { cyclesPerSecond: 15, durationMs: 20 * 1000 },

  onTick: log => {  
    console.clear()
    console.plot(log().threads().pick('snapshots').of('mean').group(), {
      title: 'Plot',
      subtitle: 'mean durations (ms)'
    })
  }
})
```

which logs: 

```js

Plot

-- sleepRandom1  -- cycle  -- sleepRandom2  -- evt_loop

11.75 ┤╭╮                                                                                                   
11.28 ┼─────────────────────────────────────────────────────────────────────╮                               
10.82 ┤│╰───╮    ╭╯ ╰╮   │╰╮  ╭─────────╯╰──────────╮ ╭─────────────────╯   ╰───────────╮╭─╮    ╭────────── 
10.35 ┼╯    ╰╮╭╮╭╯   ╰───╯ ╰──╯                     ╰─╯                                 ╰╯ ╰────╯           
 9.88 ┤      ╰╯╰╯                                                                                           
 9.42 ┤                                                                                                     
 8.95 ┤                                                                                                     
 8.49 ┤                                                                                                     
 8.02 ┤                                                                                                     
 7.55 ┤                                                                                                     
 7.09 ┤╭╮                                                                                                   
 6.62 ┼╯╰───╮    ╭─────────╮   ╭──╮                                                                         
 6.16 ┤     ╰╮╭──╯         ╰───╯  ╰───────────────────────╮       ╭─────────────────────╮╭───╮   ╭───────── 
 5.69 ┤╭╮    ╰╯                                        ╭───────────╮  ╭╮╭──────╮        ╰╯   ╰──╭╮╭─╮╭───── 
 5.22 ┤│╰╮╭─╮   ╭──╮     ╭───╮╭─╮ ╭────────────────────╯           ╰──╯╰╯      ╰────────────────╯╰╯ ╰╯      
 4.76 ┤│ ╰╯ ╰───╯  ╰─────╯   ╰╯ ╰─╯                                                                         
 4.29 ┼╯                                                                                                    

mean durations (ms)

- last: 100 items
```

## Gotchas

### Missing custom metrics

Using lambdas/arrow functions means the metrics collector has no function 
name to use for the metric. By their own definition, they are anonymous.

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
single-file benchmarks but it can create issues if you intent to run code 
after the `dyno()` resolves/ends; 
or when running this as part of an automated test suite.

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

  after: async parameters => {
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
worth proceeding with or whether it has unworkable scalability issues. 

It's multithreading nature is meant to mimic the execution model of 
horizontally-scalable, shared-nothing, cloud-deployed parallel-services that 
live behind a load balancer.

It's original purpose was for benchmarking a module prototype that 
heavily interacts with `Redis`. 

It's not meant for side-to-side benchmarking of synchronous code,
[Google's Tachometer][tachometer] being a much better fit.

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
[perf-api]: https://w3c.github.io/perf-timing-primer/
[hgram]: https://en.wikipedia.org/wiki/Histogram
[hgrams]: https://nodejs.org/api/perf_hooks.html#class-histogram
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/
[opt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
[mean]: https://en.wikipedia.org/wiki/Mean
[nd]: https://en.wikipedia.org/wiki/Normal_distribution#Standard_normal_distribution
[tachometer]: https://github.com/google/tachometer?tab=readme-ov-file
<!--- Basic -->

[console-plot]: https://github.com/nicholaswmin/console-plot
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
[todos]: ./.github/TODO.md

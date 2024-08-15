[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [overview](#overview)
* [quickstart](#install)
  + [parameters](#test-parameters)
* [test process](#the-test-process)
  - [glossary](#glossary)
* [metrics](#metrics)
  - [querying metrics](#querying-metrics)
  - [default metrics](#default-metrics)
  - [custom metrics](#recording-custom-metrics)
  - [plotting metrics](#plotting)
* [gotchas](#gotchas)
* [tests](#tests)
* [misc.](#misc)
* [authors](#authors)
* [license](#license)

## Overview

Loops a *function*, at a given *rate*, for a given *duration*, in `n` threads.

A test is deemed succesful if it ends without creating a *cycle backlog*.

> **example:** benchmark a recursive `fibonacci` function

```js
// benchmark.js
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  function fibonacci(n) {
    return n < 1 ? 0
    : n <= 2 ? 1 : fibonacci(n - 1) + fibonacci(n - 2)
  }

  fibonacci(30)

}, {
  parameters: { cyclesPerSecond: 100, threads: 4, durationMs: 5 * 1000 },
  
  onTick: metrics => {    
    console.clear()
    console.table(metrics().primary().pick('count'))
    console.table(metrics().threads().pick('mean'))
  }
})
```

run: 

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

mean of durations, in ms

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

### Configuration

```js
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  // add benchmarked task
  // code in this block runs in its own thread

}, {
  parameters: { 
    // add test parameters
  },
  
  onTick: metrics => {    
    // build logging from the provided measurements
  }
})
```

### Test parameters

| name            	| type     	| default    | description                     |
|-----------------  |----------	|----------- |-------------------------------- |
| `cyclesPerSecond` | `Number` 	| `50`       | cycle issue rate, per `second`  |
| `durationMs`      | `Number` 	| `5000`     | total test duration, in `ms`    |
| `threads`         | `Number` 	| `auto` 	   | number of spawned threads       |

> `auto`: attempts to prefill with count of available cores, can be overriden
>
> these parameters are user-configurable on test startup.


## The test process

The `primary` spawns the benchmarked code in separate, concurrently-running 
`task threads`.

Then, it starts issuing `cycle` commands to each one, in [round-robin][rr],
at a set `cycle rate`, for a set `test duration`.

A cycle command causes a `task thread` to execute it's own `task`, 
the benchmarked code and then report it's timing.

The task threads must collectively execute their tasks faster than 
the time it takes for their next `cycle` command to come through,
otherwise the entire test will start accumulating a `cycle backlog`.

When the `backlog threshold` is reached, the test stops; the configured 
`cycle rate` is deemed as the current *breaking point*  of that code.

An example:

> A benchmark configured to use `threads: 4` & `cyclesPerSecond: 4`. 

Each `task thread` must execute its own code in `< 1 second` since this 
is the rate at which it receives `cycle` commands.

### process model

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

## Glossary

#### `primary`

The main process. Orchestrates the test and the spawned `task threads`.

#### `task thread`

The benchmarked code, running in its own separate process.

Receives `cycle` commands from the primary, executes it's code and records 
its timings.

#### `task`

The benchmarked code 

#### `cycle`

A signal, telling a `task thread` to execute it's task. 

#### `cycle rate`

The rate at which the primary sends `cycle` commands to the `task threads`

#### `backlog`

Count of issued `cycle` commands that have been issued/sent but not 
executed yet.   

## Metrics

The benchmarker comes with a statistical measurement system that can be 
optionally used to diagnose bottlenecks.

In the realm of performance-testing 
(and especially so in a runtime with a garbage-collector), 
[statistical sampling][sampling] methods are robust methods used to capture 
[*reliable & reproducible*][reproducible] test results, otherwise each test run 
would produce wildly inconsistent timings.

### Metrics model

The measurement system is based on a `Metric` type, which is a 
[histogram][hgram] of a *measurement*, progressively calculated as different 
values are being repeatedly recorded over time.

### An example 

Assume [`performance.measure('foo', ...)`][measure] is called in a task,
which is a [`PerformanceAPI`][perf-api] method that records *durations*.

The benchmarker automatically detects it and creates a `Metric:foo`.

Subsequent calls with the same name: i.e `performance.measure('foo', ...)` 
will cause the benchmarker to update that same `Metric:Foo`, using the 
measure's `duration`.

Given enough samples/cycles, the metric's computed `mean` value will reflect 
a de-noised, good-enough approximation for that particular measurement.

Both the primary and each task thread record their own metrics.     
Some metrics are provided by default; others can be recorded by the user 
as part of the benchmarked code, as shown above.

> a [working example](#using-performancemeasure) using `performance.measure` 
> can be found below

### Metric structure 

| name        | description                                 |
|-------------|---------------------------------------------|
| `count`     | number of values/samples.                   |
| `min`       | minimum value                               |
| `mean`      | [mean][mean] / average of values            |
| `max`       | maximum value                               |
| `stddev`    | [standard deviation][stdev] between values  |
| `last`      | last value                                  |
| `snapshots` | past states                                 |

> timing values (durations etc) are recorded in *milliseconds*.   

### Querying metrics

Metrics can be queried using a `metrics` function, provided as an argument 
to the `onTick` callback.

```js
// ...
onTick: metrics => {    
  // primary metrics
  console.log(metrics().primary())

  // task thread metrics
  console.log(metrics().threads()) 
}
```

#### `.primary()`

get all primary/main metrics

```js
// log all primary metrics
console.log(metrics().primary())
```

#### `.threads()`

get all metrics, for each task thread

```js
// log all metric of every task-thread
console.log(metrics().threads())
```

#### `.pick()` 

reduce all metrics to a single histogram property

```js
metrics().threads().pick('min')

// from this: { cycle: [{ min: 4, max: 5 }, evt_loop: { min: 2, max: 8 } ... 
// to this  : { cycle: 4, evt_loop: 2 ...
```

> `unit` can be: `min`, `mean`, `max`, `stdev`, `snapshots`, `count`, `last`

reduce all metrics that have been `pick`-ed to an array of histograms, 
to an array of single histogram values.

```js
metrics().primary().pick('snapshots').of('max')
// [{ cycle: [5, 3, 2 ... ], evt_loop: [10, 12, 13, ...] } ...
```

> only makes sense if it comes after `.pick('snapshots')` 

#### `.only()`

get specific metric(s)

```js
metrics().threads().only('evt_loop', 'fibonacci')
// only the `evt_loop` and `fibonacci` metrics
```

> must be chained after `.primary()` or `.threads`, otherwise no-op.

#### `.sortBy(metric, direction)`

sort by specific metric

```js
metrics().threads().pick('min').sortBy('cycle', 'desc')
```

> `direction` can be: `asc`, `desc`  

>  no-op if `.group()` is chained before this.

#### `.group()`

get result as an `Object` with each metric as a property

```js
metrics().threads().pick('snapshots').of('mean').group()

// { cycle: [5, 13, 2, 6 ....], evt_loop: [11, 12, 16 ...],  ...
```

> renders subsequent `.sortBy()` as no-ops


### Default metrics

These are collected by default:

#### `primary`  

| name        | description                    |
|-------------|--------------------------------|
| `issued`    | count of issued cycles         |
| `completed` | count of processed cycles      |
| `backlog`   | count of unprocessed cycles    |
| `uptime`    | count of elapsed seconds       |

#### `threads`  

| name               | description         |
|--------------------|---------------------|
| `cycles`           | cycle timings       |
| `evt_loop`         | event loop timings  |

## Recording custom metrics

Custom metrics can be recorded with either:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

both are part of the native [Performance Measurement APIs][perf-api].

The benchmarker automatically records their timings and attaches the
tracked `Metric` histogram to its corresponding `task thread`. 

> Custom metrics only make sense in complex, *multi-part* benchmarks.  
> Simple, one-function benchmarks can just log the default `cycle` metric.

> **example:** log the running times of 2 types of `fibonacci`

```js

// performance.timerify()

import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  performance.timerify(function recursive_fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : recursive_fibonacci(n - 1) + recursive_fibonacci(n - 2)
  })(30)
  
  performance.timerify(function iterative_fibonacci(n) {
    function fib(n) {
      const phi = (1 + Math.sqrt(5)) / 2

      return Math.round(Math.pow(phi, n) / Math.sqrt(5))
    }
  })(30)

}, {
  parameters: { threads: 4 },
  
  onTick: list => {    
    console.log(metrics().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//  { 'iterative_fibonacci': 18.45, 'recursive_fibonacci': 122.51 },
//  { 'iterative_fibonacci': 13.12, 'recursive_fibonacci': 131.50 },
//  { 'iterative_fibonacci': 18.42, 'recursive_fibonacci': 151.22 },
//  { 'iterative_fibonacci': 14.11, 'recursive_fibonacci': 141.27 }
// })
```

> the benchmarker uses the *function name* as the metric name,
> so it's best to avoid using arrow-functions.   

##### using `performance.measure()`:

```js
// performance.measure()

import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 
  performance.mark('start')
  
  await new Promise(r => setTimeout(r, Math.random() * 500))
  
  performance.measure('foo', 'start')

  await new Promise(r => setTimeout(r, Math.random() * 250))

  performance.measure('bar', 'start')
}, {
  parameters: { threads: 4 },
  
  onTick: metrics => {    
    console.log(metrics().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//   { foo: 305.25, bar: 445.50 },
//   { foo: 168.21, bar: 287.10 },
//   { foo: 169.35, bar: 252.55 },
//   { foo: 297.01, bar: 456.51 }
// ]
```

### Plotting

Each metric contains *snapshots* of its past states.

This allows plotting them as a *timeline*, using the 
[`console.plot`][console-plot] module.

> **example:** instrument 2 functions & plot the timings as an ASCII chart

```js
// Requires: 
// `npm i @nicholaswmin/console-plot --no-save`

import { dyno } from '@nicholaswmin/dyno'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 

  await performance.timerify(function sleepOne(ms) {
    return new Promise(r => setTimeout(r, Math.random() * ms))
  })(Math.random() * 20)
  
  await performance.timerify(function sleepTwo(ms) {
    return new Promise(r => setTimeout(r, Math.random() * ms))
  })(Math.random() * 20)
  
}, {

  parameters: { cyclesPerSecond: 15, durationMs: 20 * 1000 },

  onTick: metrics => {  
    console.clear()
    console.plot(metrics().threads().pick('snapshots').of('mean').group(), {
      title: 'Plot',
      subtitle: 'mean durations (ms)'
    })
  }
})
```

which logs: 

```js

Plot

-- sleepOne  -- sleepTwo  -- cycle  -- evt_loop

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

Using anonymous lambdas means the benchmarker has no function name to
as a metric name. By their own definition, they are anonymous.

change this:

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

### code running multiple times

The benchmark file [self-forks][cp-fork] itself. 👀 

This means that any code that exists *outside* the `dyno` block will *also* 
run in multiple threads.

This is a design tradeoff, made to provide the ability to create simple, 
single-file benchmarks but it can create issues if you intent to run code 
after the `dyno()` resolves/ends; 
or when running this as part of an automated test suite.

> **example**: `'done'` is logged `3` times instead of `1`: 

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

#### Use a task file

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
> of a test suite, since this is the only method that actually runs
> the benchmark file just once.


### Not a load-testing tool

This is not a stress-testing tool.    
Stress-tests are far more complex and require a near-perfect 
replication of an actual production environment.

This is a prototyping tool that helps testing whether some prototype idea is 
worth proceeding with or whether it has unworkable scalability issues. 

It's multi-threaded model is meant to mimic the execution model of 
horizontally-scalable, share-nothing services.

It's original purpose was for benchmarking a module prototype that 
heavily interacts with a data store over a network. 

It's not meant for side-by-side benchmarking of synchronous code,
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

> running tests individually requires `NODE_ENV=test`,  which suppresses 
> the parameter user prompt.

meta checks:

```bash
npm run checks
```

## Misc

generate a sample benchmark:

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
[deps-report]: https://blog.author.io/npm-needs-a-personal-trainer-537e0f8859c6

<!--- Content -->

[heroku]: https://heroku.com
[rr]: https://en.wikipedia.org/wiki/Round-robin_scheduling
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[perf-api]: https://nodejs.org/api/perf_hooks.html#performancemeasurename-startmarkoroptions-endmark
[hgram]: https://en.wikipedia.org/wiki/Histogram
[hgrams]: https://nodejs.org/api/perf_hooks.html#class-histogram
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/
[opt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
[mean]: https://en.wikipedia.org/wiki/Mean
[stdev]: https://en.wikipedia.org/wiki/Standard_deviation
[reproducible]: https://en.wikipedia.org/wiki/Reproducibility
[sampling]: https://en.wikipedia.org/wiki/Sampling_(statistics)
[nd]: https://en.wikipedia.org/wiki/Normal_distribution#Standard_normal_distribution
[obj-group-by]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy
[tachometer]: https://github.com/google/tachometer?tab=readme-ov-file
<!--- Basic -->

[console-plot]: https://github.com/nicholaswmin/console-plot
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
[todos]: ./.github/TODO.md

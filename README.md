[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Install](#install)
* [Generate benchmark](#generate-a-sample)
* [Plottable benchmark](#plottable-benchmarks)
* [Avoiding self-forking](#avoiding-self-forking)
  + [Using hooks](#using-hooks)
  + [Using a task file](#using-a-task-file)
  + [Using an env. var](#using-an-env-var)
* [Tests](#tests)
* [Misc.](#misc)
* [Authors](#authors)
* [License](#license)

## Overview

It loops a *task* function, for a given *duration*, across multiple threads.

A test is succesful if it ends without creating a *cycle backlog*.

```js
// example
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function cycle() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { 
    cyclesPerSecond: 20, 
    durationMs: 4000,
    threads: 4
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

## Install

```bash
npm i @nicholaswmin/dyno
```

## Generate sample benchmark

```bash 
npx init
```

creates a preconfigured `benchmark.js`.

Run it with:

```bash
node benchmark.js
``` 

## Configuration

```js
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 
  // benchmarked code goes here

}, {
  parameters: { 
    // test parameters
    // cyclesPerSecond
  },
  
  onTick: ({ main, tasks }) => {    
    // log render function
  }
})

```

## Plottable benchmarks

Benchmark two `sleep` functions & live plot their duration as an ASCII chart

> requires [`console.plot`][console-plot]

```js
// run: `npm i --no-save https://github.com/nicholaswmin/console-plot`
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

logs: 

```js
Cycles
┌─────────┬────────┬───────────┬─────────┐
│ uptime  │ issued │ completed │ backlog │
├─────────┼────────┼───────────┼─────────┤
│ 33      │ 615    │ 614       │ 1       │ 
└─────────┴────────┴───────────┴─────────┘

Timings
┌─────────┬─────────┬──────────┬──────────┐
│ thread  │ cycle   │ sleepOne │ sleepTwo │
├─────────┼─────────┼──────────┼──────────┤
│ '80538' │ 23.11   │ 10.21    │ 18.79    │
│ '80539' │ 25.61   │ 10.16    │ 19.51    │
│ '80540' │ 21.19   │ 10.17    │ 20.18    │ 
│ '80541' │ 20.11   │ 11.68    │ 21.09    │
└─────────┴─────────┴──────────┴──────────┘

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

## Avoiding self-forking

Single-file benchmarks are straightforward to setup but suffer from a caveat
where any code that exists *outside* the `dyno` block is also 
executed multiple times.

In the following example, `'done'` is logged `3` times instead of `1`: 

```js
import { dyno } from '@nicholaswmin/dyno'

const result = await dyno(async function cycle() { 
  // task code ...
}, { threads: 3 })

console.log('done')
// 'done'
// 'done'
// 'done'
```

This can create issues when used as part of an automated test 
suite and/or attempting to do any kind of work with the test results.

### Using hooks

To work around this, the `before`/`after` hooks can be used for setup and
teardown, like so:

```js
// @TODO
```

### Using a task file

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

### Using an env var

Finally, you can use the same mechanism that `node:cluster` uses, 
using an `env. var` & a conditional to only run code once,   
as part of the `main` process.

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

> examples source is located in: [`/bin/examples`](./bin/examples)

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

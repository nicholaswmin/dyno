[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Install](#install)
* [Generate benchmark](#generate-sample-benchmark)
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

## Plottable example

> Uses [`console.plot`][console-plot]

```js
// plottable
// requires `npm i https://github.com/nicholaswmin/console-plot`

import { dyno } from '@nicholaswmin/dyno'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 
  // measure a 'sleep' random function
  await performance.timerify(async function sleep() {
    return new Promise(res => setTimeout(res, Math.random() * 20))
  })()

}, {
  parameters: { 
    cyclesPerSecond: 50, 
    durationMs: 20 * 1000,
    threads: 4
  },
  
  onTick: ({ main, tasks, snapshots }) => {   
    delete snapshots.evt_loop // discard this

    console.clear()
    console.table(main)
    console.table(tasks)
    console.plot(snapshots)
  }
})
```

which logs: 

```js
┌─────────┬────────┬────────┬───────────┬─────────┐
│ (index) │ uptime │ issued │ completed │ backlog │
├─────────┼────────┼────────┼───────────┼─────────┤
│ 0       │ 20     │ 394    │ 394       │ 0       │
└─────────┴────────┴────────┴───────────┴─────────┘

Task Timings
┌─────────┬─────────┬────┬──────────┐
│ (index) │ thread  │ cycle │ sleep │
├─────────┼─────────┼───────┼───────┤
│ 0       │ '75657' │ 10.32 │ 10.29 │ 
│ 1       │ '75658' │ 11.31 │ 11.22 │
│ 2       │ '75659' │ 10.76 │ 10.73 │ 
│ 3       │ '75660' │ 11.02 │ 10.98 │ 
└─────────┴─────────┴───────┴───────┘

  Timeline

  -- cycle  -- sleep

  11.11 ┤                              ╭╭╮╭╮                          ╭───╮ ╭╮   ╭╮                        
  10.73 ┤             ╭╮╮╭╮        ╭─╮╭─╯╰╯╰──╮               ╭───────╯   ╰──────────────╮╮                
  10.35 ┤           ╭╮│╰╮│╰╮╭╮╭────╯ ╰╯       ╰───────────────╯                          ╰──────────────── 
   9.96 ┤        ╭╮ │╰╯ ╰╯ ╰╯╰╯                                                                            
   9.58 ┤       ╭╭──╯                                                                                      
   9.20 ┤       ╭╯                                                                                         
   8.82 ┤     ╭─╯                                                                                          
   8.44 ┤     │                                                                                            
   8.05 ┤     │                                                                                            
   7.67 ┤╭╮  ╭╯                                                                                            
   7.29 ┤││  │                                                                                             
   6.91 ┤╭╮  │                                                                                             
   6.53 ┤│╰╮─│                                                                                             
   6.15 ┼│ ╰─╯                                                                                             
   5.76 ┤│                                                                                                 
   5.38 ┤│                                                                                                 
   5.00 ┼╯                                                                                                 

  cycle durations, average, in ms
```

## Avoiding self-forking

In order to allow single-file benchmarks, the benchmark self-forks itself.     
This causes any code *outside* the `dyno` blocks to execute multiple times.

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

### Using an env var

Alternatively, a check can be made against the `THREAD_INDEX` env. var.  
since that environmental variable is only set on `task` processes.

```js
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

generate sample benchmark:

```bash
npx init
```

generate [Heroku-deployable][heroku] benchmark:

```bash
npx init-cloud
```

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

[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow] [![deps-report][deps-badge]][deps-report]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Install](#install)
* [Generate benchmark](#generate-sample)
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

## Plottable benchmarks

The following example benchmarks a couple of `async sleep` function,   
and plots a timeline of their `mean/average` durations.

> requires [`console.plot`][console-plot]

```js
// requires console-plot:
// run: `npm i --no-save https://github.com/nicholaswmin/console-plot`

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
    durationMs: 20 * 1000
  },
  
  onTick: ({ main, tasks, snapshots }) => {   
    delete snapshots.evt_loop // discard this

    console.clear()
    console.table(main)
    console.table(tasks)
    console.plot(snapshots, {
      title: 'Timings timeline',
      subtitle: 'average durations, in ms',
      width: 100
    })
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
┌─────────┬─────────┬──────────┬───────┬──────────┬──────────┐
│ (index) │ thread  │ sleepOne │ cycle │ sleepTwo │ evt_loop │
├─────────┼─────────┼──────────┼───────┼──────────┼──────────┤
│ 0       │ '80246' │ 2.29     │ 3.57  │ 2        │ 10.63    │
│ 1       │ '80247' │ 2.13     │ 3     │ 1.88     │ 10.64    │
│ 2       │ '80248' │ 2.38     │ 3.63  │ 2.13     │ 10.65    │
│ 3       │ '80249' │ 2.25     │ 3.75  │ 2.25     │ 10.54    │
└─────────┴─────────┴──────────┴───────┴──────────┴──────────┘

Timeline

-- cycle -- sleepOne  -- sleepTwo

 4.00 ┼─╮                                                                                            
 3.87 ┤ │        ╭────╮                                                                              
 3.74 ┤ ╰╮      ╭╯    ╰──────╮      ╭╮                                                               
 3.62 ┤  │    ╭─╯            ╰──────╯╰──────╮       ╭─────────────────────────────────────────────── 
 3.49 ┤  ╰─╮ ╭╯                             ╰───────╯                                                
 3.36 ┤    │ │                                                                                       
 3.23 ┤    ╰─╯                                                                                       
 3.11 ┤                                                                                              
 2.98 ┤                                                                                              
 2.85 ┤                                                                                              
 2.72 ┤                                                                                              
 2.60 ┤╭╮       ╭─╮                                                                                  
 2.47 ┤││    ╭──╯ ╰───╮  ╭─╮╭───╮   ╭────╮            ╭╮                                             
 2.34 ┤│╰─╮  │   ╭╮╭─╯╰─────╮   ╰───╯    ╰────────────╯╰───────────────╭─╮────────────────────────── 
 2.21 ┤│  ╰──╯   │╰╯        ╰──────────────────────────────────────────╯ ╰────────────────────────── 
 2.09 ┼╯───╮ ╭───╯                                                                                   
 1.96 ┤    │╭╯                                                                                       
 1.83 ┤    ╰╯                                                                                        

cycle durations, average, in ms

- last: 100 items
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

[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

> test code against a certain *rate* of production traffic

* [Overview](#overview)
* [Install](#install)
* [Generate benchmark](#generate-sample-benchmark)
* [Avoiding self-forking](#avoiding-self-forking)
  + [Task file workaround](#task-file-workaround)
  + [Env. var workaround](#env-var-workaround)
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

┌─────────┬───────┬───────────┬──────────┐
│ thread  │ cycle │ fibonacci │ evt_loop │
├─────────┼───────┼───────────┼──────────┤
│ '46781' │ 9.47  │ 9.42      │ 11.01    │
│ '46782' │ 9.61  │ 9.30      │ 11.14    │ 
│ '46783' │ 9.65  │ 9.55      │ 11.18    │
│ '46784' │ 9.47  │ 9.32      │ 11.09    │
└─────────┴───────┴───────────┴──────────┘
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

## Avoiding self-forking

Because of how the [`fork` mechanism][cp-fork] works, 
running single-file benchmarks causes any code *outside* the `dyno` blocks
to *also* run in a separate thread.

In the following code, `'done'` is logged `3` times, instead of `1`: 

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

This can create issues when using this module as part of an automated test 
suite and/or attempting to do anything with the test results.

### Task file workaround

To work around this, the *task function* can be extracted into it's own file,
like so:

```js
// task.js
import { task } from '@nicholaswmin/dyno'

task(async function task() {
  // task code ...
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

### Env var workaround

Alternatively, a check can be made against the `THREAD_INDEX` env. var.  
since that environmental variable is only set on `task` processes.

```js
const isMain = typeof process.env.THREAD_INDEX === 'undefined'
const result = await dyno(async function cycle() { 
  // task code ...
}, { threads: 2 })

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

<!--- Content -->

[heroku]: https://heroku.com
[cp-fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

<!--- Basic -->

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

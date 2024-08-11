[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

> `dyno` is a tool for testing if a piece of code can withstand 
> a certain rate of production traffic

* [Quickstart](#quickstart)
  + [Install](#install)
  + [Overview](#overview)
  + [Generate benchmark](#generate-sample-benchmark)
* [Configuration](#configuration)
* [Tests](#tests)
* [Misc.](#misc)
* [Authors](#authors)
* [License](#license)

## Overview

The runner repeatedly runs a specified *task* 
for a specified *cycle per seconds* rate, 
for a specified *test duration*.

A test is deemed succesful if the *test duration*
elapses without creating a *cycle backlog*.

To maximize efficiency and mimic a production environment,   
the provided task is run across multiple threads.

```js
// example
import { dyno } from '@nicholaswmin/dyno'

const result = await dyno(async function task() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { CYCLES_PER_SECOND: 40, CONCURRENCY: 4, DURATION_MS: 10000 },
  
  onTick: stats => {    
    console.log(stats)
  }
})

console.log('Test ended, results:', result)
```

the test logs live measurements while it runs:

```js
general stats 

┌─────────┬─────────────┬─────────────┬────────────────┬──────────────┐
│ (index) │ cycles sent │ cycles done │ cycles backlog │ uptime (sec) │
├─────────┼─────────────┼─────────────┼────────────────┼──────────────┤
│ 0       │ 177         │ 174         │ 3              │ 6            │
└─────────┴─────────────┴─────────────┴────────────────┴──────────────┘

cycle timings 

┌─────────┬─────────┬──────┬───────────┬───────┬──────────┐
│ (index) │ thread  │ task │ fibonacci │ sleep │ eloop    │
├─────────┼─────────┼──────┼───────────┼───────┼──────────┤
│ 0       │ '19679' │ 72   │ 72        │ 103   │ 28617933 │
│ 1       │ '19680' │ 72   │ 72        │ 103   │ 30947191 │
│ 2       │ '19681' │ 72   │ 72        │ 103   │ 30685594 │
│ 3       │ '19682' │ 72   │ 72        │ 104   │ 28678007 │
└─────────┴─────────┴──────┴───────────┴───────┴──────────┘
```

## Quickstart

### Install

```bash
npm i @nicholaswmin/dyno
```

### Generate sample benchmark

```bash 
npx init
```

> creates a preconfigured `benchmark.js`  
> Use it as a starting point.

#### run the sample

```bash
node benchmark.js
``` 

## Configuration

> The following example benchmarks a `fibonnacci()` function
> and a `sleep()` function while also using [`performance.timerify`][timerify] 
> to record custom timing measurements.

```js
// advanced example
import { dyno } from '@nicholaswmin/dyno'

await dyno(async function task(parameters) { 
  // function under test
  function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  }

  // another function under test
  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
  }
  
  // wrap both of them in `performance.timerify` 
  // so we can log their timings in the test output
  performance.timerify(fibonacci)(parameters.FOO)
  performance.timerify(sleep)(parameters.BAR)
}, {
  parameters: {
    // required
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 10 * 1000,
    
    // optional
    FOO: 35,
    BAR: 50
  },
  
  // Render output using `console.table`
  onTick: ({ main, threads }) => {    
    const tables = {
      main: [{ 
        'cycles sent'    : main.sent?.count, 
        'cycles done'    : main.done?.count,
        'cycles backlog' : main.sent?.count -  main.done?.count,
        'uptime (sec)'   : main.uptime?.count
      }],

      threads: Object.keys(threads).reduce((acc, pid) => {
        return [ ...acc, Object.keys(threads[pid]).reduce((acc, task) => ({
          ...acc, thread: pid, [task]: Math.round(threads[pid][task].mean)
        }), {})]
      }, [])
    }
    
    console.clear()

    console.log('\n', 'general stats', '\n')
    console.table(tables.main)

    console.log('\n', 'cycle timings', '\n')
    console.table(tables.threads)
  }
})

console.log('test ended succesfully')
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

style checks/eslint:

```bash
npm run checks
```

## Misc

> create a simple runnable benchmark

```bash
npx init
```

> create a [Heroku-deployable][heroku] benchmark

```bash
npx init-cloud
```

> insert/update `README.md` example code snippets  

```bash
npm run example:update:readme
```

> note: does not update example "output"  
> The examples source is located in: [`/bin/example`](./bin/example)

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

## License

[MIT "No Attribution" License][license]

<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/test:unit.yml

[coverage-badge]: https://coveralls.io/repos/github/nicholaswmin/dyno/badge.svg?branch=main
[coverage-report]: https://coveralls.io/github/nicholaswmin/dyno?branch=main

[codeql-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml/badge.svg
[codeql-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml

<!--- Content -->

[heroku]: https://heroku.com
[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

<!--- Basic -->

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

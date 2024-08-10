[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

benchmarking in multiple threads

* [Install](#install)
* [Quickstart](#quickstart)
  + [Overview](#overview)
  + [Generate benchmark](#generate-sample-benchmark)
* [Example](#example)
  + [Run file](#run-file)
  + [Task file](#task-file)
* [Tests](#tests)
* [Misc.](#misc)
* [Authors](#authors)
* [License](#license)

## Overview

Run the following piece of code `n` number of cycles, 
on `n` number of threads:

```js
// benchmarked code
import { run } from '@nicholaswmin/dyno'

let counter = 0

run(async function task(parameters) {
  function fibonacci_1(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci_1(n - 1) + fibonacci_1(n - 2)
  }

  function fibonacci_2(n) {
    return n < 1 ? 0
    : n <= 2 ? 1
    : fibonacci_2(n - 1) + fibonacci_2(n - 2)
  }

  performance.timerify(fibonacci_1)(parameters.FOO * Math.sin(++counter))
  performance.timerify(fibonacci_2)(parameters.BAR * Math.sin(++counter))  
})
```

while rendering live output:

```js

general stats 

┌─────────┬──────┬──────┬─────────┬────────┐
│ (index) │ sent │ done │ backlog │ uptime │
├─────────┼──────┼──────┼─────────┼────────┤
│ 0       │ 179  │ 178  │ 1       │ 6      │
└─────────┴──────┴──────┴─────────┴────────┘

cycle timings (mean/ms) 

┌─────────┬──────┬─────────────┬─────────────┬──────────┐
│ (index) │ task │ fibonacci_1 │ fibonacci_2 │ eloop    │
├─────────┼──────┼─────────────┼─────────────┼──────────┤
│ 0       │ 14   │ 2           │ 13          │ 12797591 │
│ 1       │ 15   │ 2           │ 13          │ 12780725 │
│ 2       │ 16   │ 2           │ 14          │ 12793736 │
│ 3       │ 15   │ 2           │ 14          │ 12919025 │
└─────────┴──────┴─────────────┴─────────────┴──────────┘
```

> note: requires additional configuration, see below

## Install

```bash
npm i @nicholaswmin/dyno
```

## Quickstart

### Overview 

- Create a `run.js` file and set the test configuration
- Create a `task.js` file and add the benchmarked code

`run.js` runs multiple *cycles* of `task.js`, in multiple threads.

View the [example](#example) below for guidance on configuration.

### Generate sample benchmark

```bash 
npx init
```

> Use the sample benchmark as a starting point 
> by editing `run.js` & `task.js`

### Run it

> navigate into the created `benchmark` folder:

```bash
cd benchmark
```

then:

```bash
npm run benchmark
``` 

## Example

> The following example benchmark  a `fibonnacci()` function, 
> using [`performance.timerify`][timerify] to record timings

### Run file

Sets up the benchmark & internally controls the spawned threads.

```js
 // run.js
import { join } from 'node:path'
import { dyno } from '@nicholaswmin/dyno'

await dyno({
  // location of the task file
  task: join(import.meta.dirname, 'task.js'),

  // test parameters
  parameters: {
    // required
    CYCLES_PER_SECOND: 40, 
    CONCURRENCY: 4, 
    DURATION_MS: 10 * 1000,
    
    // custom, optional
    // passed-on to 'task.js'
    FOO: 30,
    BAR: 35
  },
  
  // Render output using `console.table`
  render: function({ main, threads, thread }) {
    console.clear()

    console.log('\n', 'cycle stats', '\n')
    console.table([{ 
      sent    : main.sent?.count, 
      done    : main.done?.count,
      backlog : main.sent?.count -  main.done?.count,
      uptime  : main.uptime?.count
    }])
    
    console.log('\n', 'cycle timings (mean/ms)', '\n')
    console.table(Object.keys(threads).reduce((acc, pid) => {
      return [
        ...acc, 
        Object.keys(threads[pid]).reduce((acc, task) => ({
          ...acc,
          [task]: Math.round(threads[pid][task].mean)
        }), {})]
    }, []))
  }
})

console.log('test ended succesfully!')
```

### Task file

The task file is run in its own isolated [V8 process][v8] 
`times x THREAD_COUNT`, concurrently, on separate threads.

Custom measurements can be taken using the following 
[Performance Measurement APIs][perf-api]:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

```js
 // task.js
import { run } from '@nicholaswmin/dyno'

let counter = 0

run(async function task(parameters) {
  function fibonacci_1(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci_1(n - 1) + fibonacci_1(n - 2)
  }

  function fibonacci_2(n) {
    return n < 1 ? 0
    : n <= 2 ? 1
    : fibonacci_2(n - 1) + fibonacci_2(n - 2)
  }

  performance.timerify(fibonacci_1)(parameters.FOO * Math.sin(++counter))
  performance.timerify(fibonacci_2)(parameters.BAR * Math.sin(++counter))  
})
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

> for users 

```bash
npx init
```

> create a runnable sample benchmark, 
> like the one listed above

> for contributors

```bash
npm run maintenance:update:readme
```
> insert/update example snippets in README  
> note: does not update the "output" section

Example code snippets are located in: [`/bin/example`](./bin/example)

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

[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

<!--- Basic -->

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

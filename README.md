[![test-workflow][test-badge]][test-workflow] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

run multithreaded benchmarks

* [Install](#install)
* [Quickstart](#quickstart)
  + [Overview](#overview)
  + [Generate benchmark](#generate-sample-benchmark)
* [Example](#example)
  + [Run file](#run-file)
  + [Task file](#task-file)
  + [Output](#output)
* [Tests](#tests)
* [Misc.](#misc)
* [Authors](#authors)
* [License](#license)

## Overview

Run the following piece of code `n` number of times 
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

> note: requires additional configuration, see below

rendering live output:

```js
+--------------------------------+
|             Cycles             |
+------+------+---------+--------+
| sent | done | backlog | uptime |
+------+------+---------+--------+
|  284 |  276 |       8 |      7 |
+------+------+---------+--------+

+-----------------------------------------------------------------------------+
|                                   Timings                                   |
+-----------+-----------------+-----------------------+-----------------------+
| thread id | cycle (mean/ms) | fibonacci_1 (mean/ms) | fibonacci_2 (mean/ms) |
+-----------+-----------------+-----------------------+-----------------------+
|     97339 |              77 |                     1 |                    39 |
|     97340 |              65 |                     1 |                    35 |
|     97341 |              89 |                     1 |                    41 |
|     97342 |              65 |                     1 |                    35 |
+-----------+-----------------+-----------------------+-----------------------+

  Task timings

  -- task  -- fibonacci_1  -- fibonacci_2

 148.86 ┼╮                                                                    
 134.08 ┤╰──╮                                                                 
 119.30 ┤   ╰─╮                                                               
 104.52 ┤     ╰──╮                                                            
  89.74 ┤        ╰───────────────────╮                                        
  74.96 ┼──╮                         ╰───────────────────╮                    
  60.18 ┤  ╰─────╮                                       ╰─────────────────╮  
  45.40 ┤        ╰───────────────────────────────────────╮                 │  
  30.62 ┤                                                ╰──────────────────╮ 
  15.84 ┤                                                                   ╰ 
   1.06 ┼──────────────────────────────────────────────────────────────────── 
```

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
# or just: node run.js
``` 

## Example

> The following example benchmark  a `fibonnacci()` function, 
> using [`performance.timerify`][timerify] to record timings

### Run file

Sets up the benchmark & internally controls the spawned threads.

```js
 // run.js
import { join } from 'node:path'
import { dyno, view } from '@nicholaswmin/dyno'

await dyno({
  // location of task file
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    // required test parameters
    CYCLES_PER_SECOND: 75, 
    CONCURRENCY: 4, 
    DURATION_MS: 10 * 1000,
    
    // custom parameters,
    // passed on to 'task.js'
    FOO: 25,
    BAR: 35
  },
  
  // render live test logs
  render: function({ main, threads }) {
    // `main` contains: 
    // 
    // - `main` contains general test stats
    // - `threads` contains histograms & their snapshots,
    //   per task, per thread
    // 
    const views = [
      // Log main output: 
      // general test stats, 
      // cycles sent/finished, backlog etc..
      // 
      // Available measures:
      // 
      // - 'sent', number of issued cycles 
      // - 'done', number of completed cycles 
      // - 'backlog', backlog of issued yet uncompleted cycles
      // - 'uptime', current test duration
      // 
      new view.Table('Cycles', [{
        'sent':    main?.sent?.count,
        'done':    main?.done?.count,
        'backlog': main?.sent?.count - main?.done?.count,
        'uptime':  main?.uptime?.count
      }]),
      // Log task output:
      //
      // - Per thread measurements from 'task.js'
      // 
      // Available measures:
      // - 'task', duration of a cycle/task
      // - Custom measurements appear here
      //
      new view.Table(
        'Timings', 
        Object.keys(threads)
        .map(pid => ({
          'thread id': pid,
          'cycle (mean/ms)': Math.round(threads[pid].task?.mean),
          'fibonacci_1 (mean/ms)': Math.round(threads[pid].fibonacci_1?.mean),
          'fibonacci_2 (mean/ms)': Math.round(threads[pid].fibonacci_2?.mean)
          // display only the top 5 threads, 
          // sorted by mean cycle duration
        })).sort((a, b) => b[1] - a[1]).slice(0, 5)
      ),

      new view.Plot('Task timings', { 
        properties: [
          'task', 'fibonacci_1', 'fibonacci_2'
        ]
      }).plot(Object.values(threads)[0])
    ]
    
    console.clear()
    views.forEach(view => view.render())  
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

### Output

```js
+--------------------------------+
|             Tasks              |
+------+------+---------+--------+
| sent | done | backlog | uptime |
+------+------+---------+--------+
|   49 |   48 |       1 |      5 |
+------+------+---------+--------+

+--------------------------------------------------+
|                  Task durations                  |
+-----------+----------------+---------------------+
| thread id | task (mean/ms) | fibonacci (mean/ms) |
+-----------+----------------+---------------------+
|     63511 |            157 |                  53 |
|     63512 |            159 |                  53 |
|     63513 |            174 |                  53 |
|     63514 |            160 |                  54 |
+-----------+----------------+---------------------+
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

## Misc

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

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
import { dyno, Table } from '@nicholaswmin/dyno'

await dyno({
  // location of task file
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    // required test parameters
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 5 * 1000,
    
    // custom parameters,
    // passed on to 'task.js'
    FIB_NUMBER: 35,
    ITERATIONS: 3
  },
  
  // render live test output
  render: function(threads) {
    // `threads` contains: 
    //
    // - histograms & histogram snapshots,
    //   per task, per thread
    //
    // - 1 of the threads is the 
    //   primary/main process which 
    //   contains general test stats
    // 
    const pid  = process.pid.toString()
    const main = threads[pid]
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
      new Table('Cycles', [{
        'sent':    main?.sent?.count,
        'done':    main?.done?.count,
        'backlog': main?.sent?.count - main?.done?.count,
        'uptime':  main?.uptime?.count
      }]),
      // Log task output:
      // Per thread measurements from 'task.js'
      //
      // Available measures:
      // - 'task', duration of a cycle/task
      // - any custom measurement, recorded in `task.js`
      //
      new Table('Task durations', Object.keys(threads)
      .filter(_pid => _pid !== pid)
      .map(pid => ({
        'thread id': pid,
        'cycle (mean/ms)': Math.round(threads[pid].cycle?.mean),
        'fibonacci (mean/ms)': Math.round(threads[pid].fibonacci?.mean)
      })))
    ]
    // display only the top 5 threads, 
    // sorted by mean cycle duration
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    // render the tables
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

run(async function task(parameters) {
  // parameters set in `run.js` 
  // are available here

  // function under test
  function fibonacci(n) {
    return n < 1 ? 0
          : n <= 2 ? 1
          : fibonacci(n - 1) + fibonacci(n - 2)
  }
  
  // record measurements using `performance.timerify`
  const timed_fibonacci = performance.timerify(fibonacci)
  
  for (let i = 0; i < parameters.ITERATIONS; i++)
    timed_fibonacci(parameters.FIB_NUMBER)
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

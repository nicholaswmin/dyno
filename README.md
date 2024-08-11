[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

> test code against a *certain rate* of production traffic

* [Overview](#overview)
* [Install](#install)
* [Generate benchmark](#generate-sample-benchmark)
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

await dyno(async function task() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { 
    cyclesPerSecond: 40, 
    durationMs: 10000,
    threads: 4
  },
  
  onTick: ({ main, tasks }) => {    
    console.clear()

    console.log('general')
    console.table([main])

    console.log('cycle timings (average, in ms)')
    console.table(tasks)
  }
})
```

which logs: 

```js
general

┌─────────┬────────┬──────┬──────┬─────────┐
│ (index) │ uptime │ sent │ done │ backlog │
├─────────┼────────┼──────┼──────┼─────────┤
│ 0       │ 10     │ 98   │ 98   │ 0       │
└─────────┴────────┴──────┴──────┴─────────┘

cycle timings (average, in ms)

┌─────────┬─────────┬───────┬───────┬───────────┐
│ (index) │ thread  │ eloop │ task  │ fibonacci │
├─────────┼─────────┼───────┼───────┼───────────┤
│ 0       │ '45884' │ 11.18 │ 15.04 │ 14.83     │
│ 1       │ '45885' │ 11.11 │ 15.08 │ 14.96     │
│ 2       │ '45886' │ 11.1  │ 15.04 │ 14.92     │
│ 3       │ '45887' │ 11.14 │ 15.5  │ 15.29     │
└─────────┴─────────┴───────┴───────┴───────────┘
```

## Install

```bash
npm i @nicholaswmin/dyno
```

## Generate sample benchmark

```bash 
npx init
```

> creates a preconfigured `benchmark.js`  

### run

```bash
node benchmark.js
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
[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

<!--- Basic -->

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE

# Todo

## fix

- [x] implement the `metrics.sort()` method
- [ ] metrics `snapshots` ring buffer must save saved snapshots in a 
      way that allows maintaining a good-enough historical fidelity 
      while keeping a relatively low number of items.   
      The initial values should not be replaced; neither the current ones. 
      It's current method of operation renders it of no real utility since the 
      buffer size is often less than even a 1-second cycle rate.
      There must be a statistical method as to how this can be implemented.
- [ ] Sweep over values and make sure they are accurate - some timers miss
      a second, other values have `off-by-one` issues.
- [ ] The task hooks might not be needed, if so ditch them.
- [ ] wait for `queue drain`-type of event before resolving `bus.stop` or 
      `process.stop`, otherwise race conditions occur.
      - theres now a problem on >5k tasks per second and the `task:after` 
        hook which runs `redis.disconnect()` then the backlog `taskFn` 
        attempting to save something to Redis.

## feat 

- [ ] Implement automatic *progressive-rate* benchmarking.
  - start at a low cycle rate and increase progressively, automatically. 
    Detect when a backlog is created and stop.
    The current cycle rate is set as the benchmark result.
  - this almost(?) eliminates the need for test parameters and automates the 
    bulk of the process.
- [ ] warmup period 
  - try implementing progressive-rate first which might eliminate the need
    for this.
- [x] event loop measures for each thread
- [ ] implement a backlog threshold and end the test
- [x] implement last value on `Metric`
- [x] `tasks:run` and `backlog` should ideally be tracked on the `primary`
- [ ] log test constants/parameters
  - might not be needed with single file benchmarks, user can simply 
    extract them in a variable on top-level and log them anyway.
- [x] ~~log to file?~~ 
     - No, out of scope

## refactor 
s
- [x] `npx init` should generate the bare-minimum benchmark that includes 
      reasonable features (i.e plot etc)
- [ ] `runner` and `task` are state machines, think about implementing them
      as such
- [x] The entire `stats` `tracking`/`observer` infra/language needs to be 
      rethought; what is a `stat`, what is a `measure`, why is it called 
      `tracker`?  Must get a simple, non-convoluted domain language about it.
- [ ] include a sentence in each module, explaining what it's supposed to be.

## test

- [x] test `onTick` calls and arguments
- [x] split unit tests & integration tests
- [x] ensure unit-tests run fast
  - ~~use `mock` timers from `node:test` runner where possible~~
  - not doable, threads need time to spin up
- [x] setup CodeQL workflow

## build

- [ ] publish a `v1`
- [x] "pull" this into its own project/repository
- [x] publish to `npm`

## docs

- [x] document the "running using a taskfile" case
- [x] document the `test` arguments`, inc. their defaults
- [x] document any `before/after` hooks
- [x] fix `npx init` docs after publishing
- [x] Check if possible to DRY up example code via an `npx` script. 
  Right now theres 3 different & separate code examples:
  - `.github/example/` 
  - `README` docs example 
  - `npx init` sample
- [x] document the architecture in a small paragraph

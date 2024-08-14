# Todo

## fix

- [ ] Sweep over values and make sure they are accurate - some timers miss
      a second, other values have `off-by-one` issues.
- [ ] The task hooks might not be needed, if so ditch them.
- [x] ensure all emitters report in `ms` (i.e `evt_loop`) and stop doing 
      unit-conversions in  `collector.js`.
- [ ] add parameters getter, so that printing parameters is easy
- [x] add a simplified `snapshots` getter to make plotting with `asciichart` 
      easy
- [x] simplify `onTick` arguments so the simple example can log easily 
      with a `console.table()`
- [ ] wait for `queue drain`-type of event before resolving `bus.stop` or 
      `process.stop`, otherwise race conditions occur.
      - theres now a problem on >5k tasks per second and the `task:after` 
        hook which runs `redis.disconnect()` then the backlog `taskFn` 
        attempting to save something to Redis.

## feat 

- [x] Reimplement the global `before/after` hooks
- [ ] Implement progressive-rate
  - start at a given cycles-per-second and increase automatically. 
  - detect when a backlog is created and stop.
  - the current cycles-per-second rate is the result score of the benchmark
- [ ] warmup period
- [x] event loop measures for each thread
- [ ] implement max backlog limit
- [x] implement last value on `histogram` (actual ones in collector)
- [x] `tasks:run` and `backlog` should ideally be tracked on the `runner`
  - now tracking `done` and `backlog` on the primary
- [x] log test constants/parameters
- [x] ~~log to file?~~ 
     - No, out of scope

## refactor 

- [x] `histogram` emitter should always log in `ms`. 
      Ditch `eloop` etc matchings in `collector` for specifying which props 
      need `ns` -> `ms` conversions.
- [x] `dyno` hooks before/after are unnecessary, ditch them.
- [x] there is no need for a `Dyno` class. Export a simple function instead.
- [x] `npx init` should generate the bare-minimum benchmark that includes 
      reasonable features (i.e plot etc)
- [ ] `runner` and `task` are state machines, think about implementing them
      as such
- [x] The entire `stats` `tracking`/`observer` infra/language needs to be 
      rethought; what is a `stat`, what is a `measure`, why is it called 
      `tracker`?  Must get a simple, non-convoluted domain language about it.

## test

- [x] test new `prompt`
- [x] test `onTick` calls and arguments
- [x] replace old tests with new tests on the rewrite
- [x] split unit tests & integration tests
- [x] ensure unit-tests run fast
  - ~~use `mock` timers from `node:test` runner where possible~~
  not doable, threads need time to spin up
- [x] setup CodeQL workflow

## build

- [ ] actually publish a semvered `v1`
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
- [ ] document the architecture in a small paragraph
    - include a sentence within each module, explaining at least what 
      it's supposed to be.

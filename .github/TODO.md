# Todo

## fix

- [ ] wait for `queue drain`-type of event before resolving `bus.stop` or 
      `process.stop`, otherwise race conditions occur.
      - theres now a problem on >5k tasks per second and the `task:after` 
        hook which runs `redis.disconnect()` then the backlog `taskFn` 
        attempting to save something to Redis.

## feat 

- [ ] warmup period
- [x] event loop measures for each thread
- [ ] implement max backlog limit
- [x] implement last value on `histogram` (actual ones in collector)
- [x] `tasks:run` and `backlog` should ideally be tracked on the `runner`
  - now tracking `done` and `backlog` on the primary
- [x] log test constants/parameters
- [ ] log to file?

## refactor 

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

- [ ] test new `prompt`
- [ ] test `onMeasureUpdate` calls and arguments
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

- [ ] document the `onMeasureUpdate` callback arguments `main` & `thread`s
- [x] fix `npx init` docs after publishing
- [x] Check if possible to DRY up example code via an `npx` script. 
  Right now theres 3 different & separate code examples:
  - `.github/example/` 
  - `README` docs example 
  - `npx init` sample
- [ ] document the architecture in a small paragraph
    - include a sentence within each module, explaining at least what 
      it's supposed to be.

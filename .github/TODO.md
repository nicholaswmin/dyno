# Todo

## fix

- [ ] wait for `queue drain`-type of event before resolving `bus.stop` or 
      `process.stop`, otherwise race conditions occur.
      - theres now a problem on >5k tasks per second and the `task:after` 
        hook which runs `redis.disconnect()` then the backlog `taskFn` 
        attempting to save something to Redis.
- [x] simple example in `README` incorrectly logs a `task.mean: 1`
  - its `sleep` function takes `~50 ms` to it should log a mean of `> 50`.
  - works ok, just didn't `await timerifiedFn()` in the `task`
- [x] finish, error logs are sometimes hidden by `render() console.clear()`
  - `runner` errors must be correctly logged
  - `thread` errors must be correctly logged
  - tests success must be correctly logged
- [x] ~~Use `Promise.all` to await both `foreman.start()` 
      and a `Promise setTimeout`. This allows `foreman.start` to reject in 
      case of worker error and the promise timer to work.~~  
     - No longer valid after rewrite 

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
- [ ] `npx init` should generate the bare-minimum benchmark that includes 
      reasonable features (i.e plot etc)
- [ ] `runner` and `task` are state machines, think about implementing them
      as such
- [x] The entire `stats` `tracking`/`observer` infra/language needs to be 
      rethought; what is a `stat`, what is a `measure`, why is it called 
      `tracker`? 
      Must get a simple, non-convoluted domain language about it.
- [x] the stats tracking can be vastly simplified:
    - only have an `emitter` and an `observer`. 
      Emitters should be the same locally or remote. 
    - They should use a single `Bus` which emits both locally & `process.send`.
    - No distinction should be made between primary/runner or thread. 
      The primary is a thread in and by itself. The observer can figure out
      which is the primary, not the emitters nor the bus.
    - avoid an `emitter.publish()` method. 
      The `histogram` can emit/signal to its parent `emitter` that a value 
      was recorded in which case it would send the value via the `Bus`.
    - consider using a singleton/factory so that all stats tracking for a
      process can be batched/accumulated in a single-point. 
      A process can have many emitters that publish to a single-point which
      then publishes on a single bus.
    - The `emitters` should not have histograms. 
      They should only implement the histogram interface methods and publish 
      the values. Histograms should only be created and tracked in the observer.

## test

- [x] replace old tests with new tests on the rewrite
- [x] split unit tests & integration tests
- [x] ensure unit-tests run fast
  - ~~use `mock` timers from `node:test` runner where possible~~
  not doable, threads need time to spin up
- [x] setup CodeQL workflow

## build

- [x] "pull" this into its own project/repository
- [ ] publish to `npm`

## docs

- [ ] fix `npx init` docs after publishing
- [x] Check if possible to DRY up example code via an `npx` script. 
  Right now theres 3 different & separate code examples:
  - `.github/example/` 
  - `README` docs example 
  - `npx init` sample
- [ ] document the architecture in a small paragraph
    - include a sentence within each module, explaining at least what 
      it's supposed to be.

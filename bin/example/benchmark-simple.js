import { dyno } from '{{entrypath}}'

await dyno(async function task() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { CYCLES_PER_SECOND: 40, CONCURRENCY: 4, DURATION_MS: 10000 },
  
  onTick: stats => console.log(stats)
})

import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 

  function fibonacci(n) {
    return n < 1 ? 0
    : n <= 2 ? 1 : fibonacci(n - 1) + fibonacci(n - 2)
  }

  fibonacci(24)

}, {
  parameters: { cyclesPerSecond: 100, threads: 4, durationMs: 5 * 1000 },
  
  onTick: metrics => {    
    console.clear()
    console.table(metrics().primary().pick('count'))
    console.table(metrics().threads().pick('mean'))
  }
})

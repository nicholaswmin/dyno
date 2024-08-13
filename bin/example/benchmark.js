import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 
  // <benchmarked-code>

  function fibonacci(n) {
    return n < 1 ? 0
    : n <= 2 ? 1 : fibonacci(n - 1) + fibonacci(n - 2)
  }

  fibonacci(35)

  // </benchmarked-code>
}, {
  parameters: { 
    cyclesPerSecond: 100, threads: 4, durationMs: 5 * 1000
  },
  
  // log live stats
  onTick: ({ primary, threads }) => {    
    console.clear()
    console.table(primary.toUnit('mean'))
    console.table(threads.toUnit('mean'))
  }
})

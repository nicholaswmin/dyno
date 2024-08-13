
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { 
    cyclesPerSecond: 20
  },
  
  onTick: ({ primary, threads }) => {    
    console.clear()
    console.table(primary.toUnit('mean'))
    console.table(threads.toUnit('mean'))
  }
})

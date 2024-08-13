
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
  
  onTick: ({ threads }) => {    
    console.log(threads.first()?.toList())
  }
})

// logs 

// { name: 'cycle', min: 6, max: 12, mean: 8, stddev: 2, snapshots: [...] },
// { name: 'fibonacci', min: 3, max: 6, mean: 4, stddev: 1, snapshots: [...] },
// ....

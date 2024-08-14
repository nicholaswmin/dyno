
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { threads: 4 },
  
  onTick: list => {    
    console.log(list().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//  { cycle: 148.9, 'fibonacci': 101.4 },
//  { cycle: 163.6, 'fibonacci': 145.2 },
//  { cycle: 184.6, 'fibonacci': 145.8 },
//  { cycle: 145.3, 'fibonacci': 121.9 }
// })

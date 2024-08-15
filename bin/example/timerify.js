
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 

  performance.timerify(function recursive_fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : recursive_fibonacci(n - 1) + recursive_fibonacci(n - 2)
  })(30)
  
  performance.timerify(function iterative_fibonacci(n) {
    function fib(n) {
      const phi = (1 + Math.sqrt(5)) / 2

      return Math.round(Math.pow(phi, n) / Math.sqrt(5))
    }
  })(30)

}, {
  parameters: { threads: 4 },
  
  onTick: list => {    
    console.log(metrics().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//  { 'iterative_fibonacci': 18.45, 'recursive_fibonacci': 122.51 },
//  { 'iterative_fibonacci': 13.12, 'recursive_fibonacci': 131.50 },
//  { 'iterative_fibonacci': 18.42, 'recursive_fibonacci': 151.22 },
//  { 'iterative_fibonacci': 14.11, 'recursive_fibonacci': 141.27 }
// })

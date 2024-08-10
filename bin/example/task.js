import { run } from '{{entrypath}}'

run(async function task(parameters) {
  function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci_1(n - 1) + fibonacci_1(n - 2)
  }
  
  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
  }
  
  performance.timerify(fibonacci)(parameters.FOO)
  performance.timerify(sleep)(parameters.BAR)
})

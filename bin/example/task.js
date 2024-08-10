import { task } from '{{entrypath}}'

task(async function task(parameters) {
  // function under test
  function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  }

  // another function under test
  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
  }
  
  // wrap both of them in `performance.timerify` 
  // so we can log their timings in the test output
  performance.timerify(fibonacci)(parameters.FOO)
  performance.timerify(sleep)(parameters.BAR)
})

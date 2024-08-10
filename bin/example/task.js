import { run } from '{{entrypath}}'

run(async function task(parameters) {
  // parameters set in `run.js` 
  // are available here

  // function under test
  function fibonacci(n) {
    return n < 1 ? 0
          : n <= 2 ? 1
          : fibonacci(n - 1) + fibonacci(n - 2)
  }
  
  // record measurements using `performance.timerify`
  const timed_fibonacci = performance.timerify(fibonacci)
  
  for (let i = 0; i < parameters.ITERATIONS; i++)
    timed_fibonacci(parameters.FIB_NUMBER)
})

import { run } from '{{entrypath}}'

let counter = 0

run(async function task(parameters) {
  function fibonacci_1(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci_1(n - 1) + fibonacci_1(n - 2)
  }

  function fibonacci_2(n) {
    return n < 1 ? 0
    : n <= 2 ? 1
    : fibonacci_2(n - 1) + fibonacci_2(n - 2)
  }

  performance.timerify(fibonacci_1)(parameters.FOO * Math.sin(++counter))
  performance.timerify(fibonacci_2)(parameters.BAR * Math.sin(++counter))  
})

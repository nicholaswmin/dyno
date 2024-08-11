import { dyno } from '@nicholaswmin/dyno'

await dyno(async function task(parameters) { 
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
}, {
  parameters: {
    // required
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 10 * 1000,
    
    // optional
    FOO: 35,
    BAR: 50
  },
  
  // Render output using `console.table`
  onMeasure: function({ main, threads }) {    
    const tables = {
      main: [{ 
        'cycles sent'    : main.sent?.count, 
        'cycles done'    : main.done?.count,
        'cycles backlog' : main.sent?.count -  main.done?.count,
        'uptime (sec)'   : main.uptime?.count
      }],

      threads: Object.keys(threads).reduce((acc, pid) => {
        return [ ...acc, Object.keys(threads[pid]).reduce((acc, task) => ({
          ...acc, thread: pid, [task]: Math.round(threads[pid][task].mean)
        }), {})]
      }, [])
    }
    
    console.clear()

    console.log('\n', 'general stats', '\n')
    console.table(tables.main)

    console.log('\n', 'cycle timings', '\n')
    console.table(tables.threads)
  }
})

console.log('test ended succesfully')

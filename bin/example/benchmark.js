import { dyno } from '{{entrypath}}'

await dyno(async function task() { 

  performance.timerify(function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2)
  })(30)

}, {
  parameters: { 
    cyclesPerSecond: 40, 
    durationMs: 10000,
    threads: 4
  },
  
  onTick: ({ main, tasks }) => {    
    console.clear()

    console.log('general')
    console.table([main])

    console.log('cycle timings (average, in ms)')
    console.table(tasks)
  }
})

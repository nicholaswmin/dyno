import { join } from 'node:path'
import { dyno } from '{{entrypath}}'

await dyno({
  // location of the task file
  task: join(import.meta.dirname, 'task.js'),

  // test parameters
  parameters: {
    // required
    CYCLES_PER_SECOND: 40, 
    CONCURRENCY: 4, 
    DURATION_MS: 10 * 1000,
    
    // custom, optional
    // passed-on to 'task.js'
    FOO: 30,
    BAR: 35
  },
  
  // Render output using `console.table`
  render: function({ main, threads, thread }) {
    console.clear()

    console.log('\n', 'cycle stats', '\n')
    console.table([{ 
      sent    : main.sent?.count, 
      done    : main.done?.count,
      backlog : main.sent?.count -  main.done?.count,
      uptime  : main.uptime?.count
    }])
    
    console.log('\n', 'cycle timings (mean/ms)', '\n')
    console.table(Object.keys(threads).reduce((acc, pid) => {
      return [
        ...acc, 
        Object.keys(threads[pid]).reduce((acc, task) => ({
          ...acc,
          [task]: Math.round(threads[pid][task].mean)
        }), {})]
    }, []))
  }
})

console.log('test ended succesfully!')

import { join } from 'node:path'
import { main } from '{{entrypath}}'

await main({
  // task file path
  task: join(import.meta.dirname, 'task.js'),

  // parameters
  parameters: {
    // required
    CYCLES_PER_SECOND: 40, 
    CONCURRENCY: 4, 
    DURATION_MS: 10 * 1000,
    
    // optional,
    // passed-on to 'task.js'
    FOO: 35,
    BAR: 50
  },
  
  // Render output using `console.table`
  onMeasureUpdate: function({ main, threads }) {    
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

console.log('test ended succesfully!')

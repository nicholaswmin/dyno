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
  onMeasureUpdate: function({ main, threads }) {    
    const tables = {
      main: [{ 
        'sent'         : main.sent?.count, 
        'done'         : main.done?.count,
        'backlog'      : main.sent?.count -  main.done?.count,
        'uptime (sec)' : main.uptime?.count
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

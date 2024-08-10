import { join } from 'node:path'
import { dyno, view } from '{{entrypath}}'

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
  
  // Render output using `view.Table` & `view.Plot`
  render: function({ main, threads, thread }) {
    // - `main` contains general test stats
    //    - `sent`   : number of issued cycles 
    //    - `done`   : number of completed cycles 
    //    - `uptime` : test duration in seconds
    // 
    // - `threads` contains task/threads measures
    //    - `task`  : duration of a cycle
    //    - `eloop` : duration of event loop
    //    - any user-defined measures from `task.js`
    // 
    // - `thread` is just the 1st of `threads`
    const views = [

      // Build main output as ASCII Table
      new view.Table('General', [{
        'sent':    main?.sent?.count,
        'done':    main?.done?.count,
        'backlog': main?.sent?.count - main?.done?.count,
        'uptime':  main?.uptime?.count
      }]),

      // Build per-thread output as ASCII Table
      new view.Table(
        'Cycles', 
        Object.keys(threads)
        .map(pid => ({
          'thread id': pid,
          'cycle (mean/ms)': Math.round(threads[pid].task?.mean),
          'fibonacci_1 (mean/ms)': Math.round(threads[pid].fibonacci_1?.mean),
          'fibonacci_2 (mean/ms)': Math.round(threads[pid].fibonacci_2?.mean)
          // show top 5 threads, sorted by cycle time
        })).sort((a, b) => b[1] - a[1]).slice(0, 5)
      ),

      // Build an ASCII chart of per-task timings,
      // excluding event-loop timings
      new view.Plot('mean/ms timings', thread, { 
        exclude: ['eloop']
      })
    ]
    
    // Render the views in the terminal
    console.clear()
    views.forEach(view => view.render())  
  }
})

console.log('test ended succesfully!')

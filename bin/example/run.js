import { join } from 'node:path'
import { dyno, view } from '{{entrypath}}'

await dyno({
  // location of task file
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    // required test parameters
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 5 * 1000,
    
    // custom parameters,
    // passed on to 'task.js'
    FIB_NUMBER: 35,
    ITERATIONS: 3
  },
  
  // render live test logs
  render: function(threads) {
    // `threads` contains: 
    //
    // - histograms & histogram snapshots,
    //   per task, per thread
    //
    // - 1 of the threads is the 
    //   primary/main process which 
    //   contains general test stats
    // 
    const pid  = process.pid.toString()
    const main = threads[pid]
    const views = [
      // Log main output: 
      // general test stats, 
      // cycles sent/finished, backlog etc..
      // 
      // Available measures:
      // 
      // - 'sent', number of issued cycles 
      // - 'done', number of completed cycles 
      // - 'backlog', backlog of issued yet uncompleted cycles
      // - 'uptime', current test duration
      // 
      new view.Table('Cycles', [{
        'sent':    main?.sent?.count,
        'done':    main?.done?.count,
        'backlog': main?.sent?.count - main?.done?.count,
        'uptime':  main?.uptime?.count
      }]),
      // Log task output:
      //
      // - Per thread measurements from 'task.js'
      // - Custom measurements can be recorded here
      // - e.g the 'fibonacci' measurement is a 
      //   custom measurement recorded using 
      //   `performance.timerify`
      // 
      // Available measures:
      // - 'task', duration of a cycle/task
      // 
      // Custom measurements can also be 
      // recorded in `task.js`
      //
      new view.Table('Task durations', Object.keys(threads)
      .filter(_pid => _pid !== pid)
      .map(pid => ({
        'thread id': pid,
        'cycle (mean/ms)': Math.round(threads[pid].task?.mean),
        'fibonacci (mean/ms)': Math.round(threads[pid].fibonacci?.mean)
      })))
    ]
    // display only the top 5 threads, 
    // sorted by mean cycle duration
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    // render the tables
    console.clear()
    views.forEach(view => view.render())  
  }
})

console.log('test ended succesfully!')

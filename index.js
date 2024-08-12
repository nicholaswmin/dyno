import os from 'node:os'
import timer from 'timers/promises'
import task from './src/task/index.js'
import prompt from './src/prompt/index.js'
import Uptimer from './src/uptimer/index.js'
import threadpool from './src/threadpool/index.js'
import Collector from './src/collector/index.js'
import Scheduler from './src/scheduler/index.js'

const dyno = async (taskFn, { 
  parameters, 
  onTick = () => {},
  before = async () => {},
  after  = async () => {}
}) => {
  const isPrimary = !Object.hasOwn(process.env, 'THREAD_INDEX')

  if (isPrimary) {  
    await before(parameters)

    parameters = await prompt(parameters, {
      disabled: ['test'].includes(process.env.NODE_ENV?.toLowerCase()),
      defaults: {
        cyclesPerSecond: 10,
        durationMs: 5000,
        threads: os.availableParallelism()
      }
    })

    const abortctrl = new AbortController()
    const collector = new Collector()
    const uptimer = new Uptimer()
    const scheduler = new Scheduler(parameters)
    const threads = await threadpool.fork(
      // @TODO document the following line intention
      typeof taskFn === 'function' ? process.argv[1] : taskFn, { 
      threads: parameters.threads,
      parameters: parameters
    })
    
    process.start()
    collector.start(threads, onTick.bind(this))
    scheduler.start(threads)
    uptimer.start()
  
    try {
      await Promise.race([
        threadpool.watch(threads, abortctrl),
        timer.setTimeout(parameters.durationMs, null, abortctrl)
      ])
    } finally {
      await after(parameters, collector.stats)

      abortctrl.abort()
      uptimer.stop()
      scheduler.stop()
      collector.stop()
  
      await threadpool.disconnect(threads)
    }
  
    return collector.stats
  }
  
  return task(taskFn)
}

export { dyno, task }

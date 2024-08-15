import os from 'node:os'
import timer from 'timers/promises'

import './src/global-bus/index.js'
import prompt from './src/prompt/index.js'
import threadpool from './src/threadpool/index.js'
import runTask from './src/run-task/index.js'
import Uptimer from './src/uptimer/index.js'
import Scheduler from './src/scheduler/index.js'
import { MetricsCollector } from './src/metrics/index.js'

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
        cyclesPerSecond: 50,
        durationMs: 5 * 1000,
        threads: os.availableParallelism()
      }
    })

    const abortctrl = new AbortController()
    const collector = new MetricsCollector()
    const scheduler = new Scheduler(parameters)
    const uptimer = new Uptimer()
    const threads = await threadpool.fork(
      // @TODO document the following line intention
      typeof taskFn === 'function' ? process.argv[1] : taskFn, { 
      threads: parameters.threads,
      parameters: parameters
    })
    
    process.start()
    scheduler.start(threads)
    collector.start(threads, onTick.bind(this))
    uptimer.start()

    try {
      await Promise.race([
        threadpool.watch(threads, abortctrl),
        timer.setTimeout(parameters.durationMs, null, abortctrl)
      ])
    } finally {
      await after(parameters, collector.result())

      abortctrl.abort()
      collector.stop()
      uptimer.stop()
      scheduler.stop()
  
      await threadpool.disconnect(threads)
    }
  
    return collector.result()
  }
  
  return runTask(taskFn)
}

export { dyno, runTask as task }

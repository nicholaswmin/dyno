import timer from 'timers/promises'
import task from './src/task/index.js'
import prompt from './src/prompt/index.js'
import Uptimer from './src/uptimer/index.js'
import threader from './src/threader/index.js'
import Collector from './src/collector/index.js'
import Scheduler from './src/scheduler/index.js'

process.env.IS_PRIMARY = !Object.hasOwn(process.env, 'THREAD_INDEX')

const dyno = async (taskFn, { parameters, onTick = () => {} }) => {
  if (process.env.IS_PRIMARY) {  
    parameters = await prompt(parameters, {
      skipUserInput: ['test'].includes(process.env.NODE_ENV)
    })

    const abortctrl = new AbortController()
    const collector = new Collector()
    const uptimer = new Uptimer()
    const scheduler = new Scheduler(parameters)
    const threads = await threader.fork(
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
        threader.watch(threads, abortctrl),
        timer.setTimeout(parameters.durationMs, null, abortctrl)
      ])
    } finally {
      abortctrl.abort()
      uptimer.stop()
      scheduler.stop()
      collector.stop()
  
      await threader.disconnect(threads)
    }
  
    return collector.stats
  }
  
  return task(taskFn)
}

export { dyno, task }

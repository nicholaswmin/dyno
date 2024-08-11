import timer from 'timers/promises'
import task from './src/task/index.js'
import prompt from './src/prompt/index.js'
import Uptimer from './src/uptimer/index.js'
import threader from './src/threader/index.js'
import Collector from './src/collector/index.js'
import Scheduler from './src/scheduler/index.js'

const isPrimary = !Object.hasOwn(process.env, 'thread_index')

const dyno = async (taskFn, { parameters, onMeasure = () => {} }) => {
  if (isPrimary) {  
    parameters = await prompt(parameters, {
      skipUserInput: ['test'].includes(process.env.NODE_ENV)
    })

    const abortctrl = new AbortController()
    const collector = new Collector()
    const uptimer = new Uptimer()
    const scheduler = new Scheduler({ 
      cyclesPerSecond: parameters.CYCLES_PER_SECOND 
    })
    const threads = await threader.fork(
      // @TODO document the following line intention
      typeof taskFn === 'function' ? process.argv[1] : taskFn, { 
      concurrency: parameters.CONCURRENCY,
      parameters: parameters
    })
    
    process.start()
    collector.start(threads, onMeasure.bind(this))
    scheduler.start(threads)
    uptimer.start()
  
    try {
      await Promise.race([
        threader.watch(threads, abortctrl),
        timer.setTimeout(parameters.DURATION_MS, null, abortctrl)
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

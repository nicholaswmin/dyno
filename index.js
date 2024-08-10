import timer from 'timers/promises'

import Table from './src/views/table/index.js'
import Plot from './src/views/plot/index.js'

import run from './src/task/index.js'
import prompt from './src/prompt/index.js'
import Uptimer from './src/uptimer/index.js'
import threader from './src/threader/index.js'
import Collector from './src/collector/index.js'
import Scheduler from './src/scheduler/index.js'

const dyno = async ({ task, parameters, render = () => {} }) => {
  parameters = await prompt(parameters, {
    skipUserInput: ['test'].includes(process.env.NODE_ENV)
  })

  const abortctrl = new AbortController()
  const collector = new Collector()
  const uptimer = new Uptimer()
  const scheduler = new Scheduler({ 
    cyclesPerSecond: parameters.CYCLES_PER_SECOND 
  })
  const threads = await threader.fork(task, { 
    concurrency: parameters.CONCURRENCY,
    parameters: parameters
  })
  
  process.start()
  collector.start(threads, render.bind(this))
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

const view = { Table, Plot }

export { dyno, run, view }

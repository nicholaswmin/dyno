import { process } from '../bus/index.js'
import { metric } from '../metrics/index.js'
import { 
  LoopDelayObserver, 
  mapToEntries 
} from './perf_hook-helpers/index.js'

const run = async (taskFn, {
  before = async () => {},
  after =  async () => {}
} = {}) => {
  const parameters = Object.freeze(JSON.parse(process.env.parameters))
  await before(parameters)

  const timed_task = performance.timerify(taskFn.bind(this))
  const taskRunner = parameters => timed_task(parameters)
  const loopObserver = new LoopDelayObserver(metric('evt_loop').record)
  const perfObserver = new PerformanceObserver(mapToEntries(entry => {
    metric(entry.name).record(entry.duration)
  }))
  
  process.on('process:disconnect', async () => {
    loopObserver.disconnect()
    perfObserver.disconnect()
    metric().stop()

    process.stop()
    await after(parameters)
    process.disconnect()
  })
  
  process.on('cycle:start', async () => {
    await taskRunner(parameters)
    process.send({ name: 'cycle:completed' })
  }) 
  
  loopObserver.observe()
  perfObserver.observe({ 
    entryTypes: ['function', 'measure'] 
  })
}

export default run

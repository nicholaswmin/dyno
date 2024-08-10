import { process } from '../bus/index.js'
import histogram from '../histogram/index.js'
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
  const loopObserver = new LoopDelayObserver(histogram('eloop').record)
  const perfObserver = new PerformanceObserver(mapToEntries(entry => {
    histogram(entry.name).record(entry.duration)
  }))
  
  process.on('process:disconnect', async () => {
    loopObserver.disconnect()
    perfObserver.disconnect()
    histogram().stop()

    process.stop()
    await after(parameters)
    process.disconnect()
  })
  
  process.on('cycle:start', async () => {
    await taskRunner(parameters)
    process.send({ name: 'cycle:done' })
  }) 
  
  loopObserver.observe()
  perfObserver.observe({ 
    entryTypes: ['function', 'measure'] 
  })
}

export default run

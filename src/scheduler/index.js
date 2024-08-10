import { validatePositiveInteger } from './validators.js'
import histogram from '../histogram/index.js'

class Scheduler {
  constructor({ cyclesPerSecond }) {
    this.on = true
    this.timer = null
    this.cyclesPerSecond = this.#validateRate(cyclesPerSecond)
    this.lastThreadIndex = 0
    this.listeners = []
  }
  
  start(threads) {
    this.#throwIfRunning()
    this.#addCycleDoneListeners(threads)

    this.timer = setInterval(
      this.#scheduleOnNextThread.bind(this, threads),
        Math.round(1000 / this.cyclesPerSecond)
    )
  }
  
  stop() {
    this.#throwIfStopped()

    this.on = false
    this.#stopTaskScheduling()
    this.#removeCycleDoneListeners()
    process.stop()
  }
  
  #stopTaskScheduling() {
    clearInterval(this.timer)
    this.timer = null
  }

  #addCycleDoneListeners(threads) {
    Object.values(threads).forEach(thread => {
      const listener = {
        thread: thread,
        handler: function measureDone({ name }) {
          if (['cycle:done'].includes(name))
            histogram('done').record(1)
        }
      }

      thread.on('message', listener.handler)
      this.listeners.push(listener)
    })
  }

  #removeCycleDoneListeners() {
    this.listeners.forEach(listener => 
      listener.thread.off('message', listener.handler))
    
    this.listeners = []
  }
  
  #scheduleOnNextThread(threads) {
    // - If calculated `interval < 1ms`, which is the minimum possible 
    //   `setInterval()` duration, we create additional synthetic/filler 
    //    `process.send` calls to match the desired send cycle rate.
    //
    // - If calculated `interval < 1ms`, which is the minimum possible 
    //   `setInterval()` duration, we create additional synthetic/filler 
    //    `process.send` calls to match the desired send cyclesPerSecond.
    // @WARNING: 
    // - If `cyclesPerSecond > 1000`, it has to be set as multiples of `1000`, 
    //   otherwise `fillerCycles` won't be able to correctly fill the remainder.       
    const fracInterval = 1000 / this.cyclesPerSecond
    const fillerCycles = Math.ceil(1 / fracInterval)
  
    for (let i = 0; i < fillerCycles; i++) {
      const _threads = Object.values(threads)
      
      this.lastThreadIndex = this.lastThreadIndex < _threads.length - 1 
        ? ++this.lastThreadIndex
        : 0
      
      const thread = _threads[this.lastThreadIndex]
  
      thread && thread.connected && this.on
        ? thread.send({ name: 'cycle:start' }) 
          ? histogram('sent').record(1)
          : (() => {
            throw new Error('IPC oversaturated. Set "cyclesPerSecond" lower')
          })
        : false
    }
  }
  
  #throwIfStopped() {
    if (!this.on)
      throw new TypeError('Scheduler is already stopped')
  }
  
  #throwIfRunning() {
    if (this.timer)
      throw new TypeError('Scheduler is already running')
  }
  
  #validateRate(arg) {
    validatePositiveInteger(arg, 'cyclesPerSecond')

    if (arg > 10000)
      throw new RangeError(`"cyclesPerSecond" must be <= 10000, is: ${arg}`)

    if (arg > 1000 && arg % 1000 > 0)
      throw new RangeError(
        `"cyclesPerSecond" must be multiples of 1000 when > 1000, got: ${arg}`
      )
    
    return arg
  }
}

export default Scheduler

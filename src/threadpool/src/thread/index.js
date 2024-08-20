import { EventEmitter, once } from 'node:events'

import { PrimaryBus } from '../bus/index.js'
import { validInt } from '../validate/index.js'

class Thread extends EventEmitter {
  #exitTimer = null

  #pid = null
  #dead = false
  #alive = true

  // @REVIEW not needed, 
  // set so `Object.assign` doesnt throw for lacking 
  // setters of below.
  #x = null
 
  get pid()        { return this.cp.pid             }
  get dead()       { return this.exitCode !== null  }
  get alive()      { return !this.dead              }

  get exitCode()   { return this.#computeExitCode() }
  get signalCode() { return this.cp.signalCode      }
  get connected()  { return this.cp.connected       }

  // @REVIEW not needed
  // set so `Object.assign` doesnt throw for lacking setters of above.
  set pid(pid)             { return this.#x = pid       }
  set exitCode(code)       { return this.#x = code      }
  set signalCode(signal)   { return this.#x = signal    }
  set connected(connected) { return this.#x = connected }
  
  constructor(cp) {
    super()
    this.cp = cp
  
    this.exitTimeout = 300

    this.bus = new PrimaryBus(cp)

    Object.assign(this, cp)

    this.#addEndListeners(this.cp)
  }
  
  async exit() {
    await this.bus.stop()

    const [ winner ] = await Promise.race([
      this.#startExitTimeout(),
      this.#startExitAttempt()
    ])
    .finally(this.#abortExitTimer.bind(this))

    return ['EXIT_TIMEOUT'].includes(winner) 
      ? this.#forceKill().then(() => 1)
      : winner
  }
  
  emit(...args) {
    this.bus.emit(...args)
    super.emit(...args)
    return this
  }
  
  on(...args) {
    this.bus.on(...args)

    super.on(...args)
    
    return this
  }
  
  async #forceKill() {
    queueMicrotask(() => this.cp.kill('SIGKILL'))

    return await this.#onceDead()
  }
  
  async #startExitAttempt() {
    queueMicrotask(() => this.cp.send('exit'))

    return await this.#onceDead()
  }
  
  #onceDead() {
    this.cp.removeAllListeners()

    return Promise.race([
      'exit', 
      'error'
    ].map(e => once(this.cp, e)))
  }
  
  async #startExitTimeout() {
    return new Promise(resolve => 
      this.#exitTimer = setTimeout(() => 
        resolve(['EXIT_TIMEOUT']), 
        validInt(this.exitTimeout, 'exitTimeout')
      )
    )
  }
  
  async #abortExitTimer() {
    clearTimeout(this.#exitTimer)

    this.#exitTimer = null
    
    return this
  }
  
  #computeExitCode() {
    return this.cp.exitCode !== null 
      ? this.cp.exitCode : this.cp.signalCode !== null 
        ? this.cp.signalCode === 'SIGKILL' ? 1 : 0 : null
  }
  
  #addEndListeners(ee) {
    const self = this

    const onError = err => 
      self.off('exit', onExit)
          .emit('end', err)

    const onExit = () =>
      self.off('error', onError)
          .emit('end', this.exitCode > 0 
        ? new Error('nonzero exit') : null
      )
    
    ee.once('exit', onExit).once('error', onError)
  }
}

export { Thread }

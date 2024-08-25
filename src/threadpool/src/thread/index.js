import { EventEmitter, once } from 'node:events'
import { emitWarning } from 'node:process'
import { PrimaryBus } from '../bus/index.js'
import { validateInteger } from '../validate/index.js'

class Thread extends EventEmitter {
  #stderr = ''
  #forceKillTimer = null

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
  
  constructor(cp, { readyTimeout, killTimeout }) {
    super()

    this.cp  = cp
    this.bus = new PrimaryBus(cp, { readyTimeout, killTimeout })
    
    this.readyTimeout = readyTimeout
    this.killTimeout = killTimeout
    
    Object.assign(this, cp)

    this.#addEndListeners(this.cp)
  }
  
  async kill() {
    this.bus.stop()

    return await Promise.race([
      this.#attemptForceKill(),
      this.#attemptGraceKill()
    ])
    .finally(this.#abortForceKill.bind(this))
    .then(res => this.exitCode)
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

  async #attemptForceKill() {
    return this.#forceKillTimer 
      ? emitWarning('#attemptForceKill called twice')
      : new Promise((resolve, reject) => {
        this.#forceKillTimer = setTimeout(() => {
          this.#forceKillTimer = null

          return this.#forceKill()
            .then(this.#onceDead.bind(this))
            .catch(reject.bind(this))
        }, this.killTimeout)
      })
  }
  
  async #abortForceKill() {
    clearTimeout(this.#forceKillTimer)
    this.#forceKillTimer = null
  }

  async #forceKill() {
    queueMicrotask(() => this.cp.kill('SIGKILL'))

    return await this.#onceDead()
  }
  
  #attemptGraceKill(signal) {
    queueMicrotask(() => this.cp.kill(signal))

    return this.#onceDead()
  }
  
  #onceDead() {
    return Promise.race(['exit', 'error']
      .map(e => once(this.cp, e)))
  }
  
  #computeExitCode() {
    return this.cp.exitCode !== null 
      ? this.cp.exitCode : this.cp.signalCode !== null 
        ? this.cp.signalCode === 'SIGKILL' ? 1 : 0 : null
  }
  
  #addEndListeners(ee) {
    const onError = err => 
      this.off('exit', onExit)
        .emit('thread-error', err)
    
    const onExit = (code, signal) => {
      const err = new Error(this.#stderr || signal) || null

      if (err)
        this.off('error', onError)
          .emit('thread-error', err)
    }

    if (ee.stderr)
      ee.stderr.on('data', data => this.#stderr += data.toString().trim())

    ee.once('exit', onExit).once('error', onError)
  }
}

export { Thread }

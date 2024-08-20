import { setImmediate, setTimeout } from 'node:timers/promises'
import { EventEmitter, once, getEventListeners } from 'node:events'
import { randomUUID }  from 'node:crypto'

class PrimaryBus extends EventEmitter {
  #on = true

  constructor() {
    super()
    this.id  = randomUUID()
    this.pid = process.pid
    this.threads = []
  }
  
  start(threads) {
    const self = this
    function emit(args) { 
      self.#on ? self.emit(...args) : 0
    }

    this.threads = threads
      .map(thread => new DiscreetEmitter(thread))
      .map(thread => {
        return thread
          .on('message', emit)
          .once('error', t => this.removeThread(t))
          .once('exit',  t => this.removeThread(t))
          .once('close', t => this.removeThread(t))
      })
  }
  
 async stop() {
    this.#on = false
    process.removeAllListeners()

    await setImmediate()

    this.threads
      .forEach(thread => this
        .removeThread(thread))
    
    return this
  }
  
  emit(...args) {
    if (!this.#on) 
      return null

    this.threads
      .filter(thread => thread.connected)
      .filter(thread => thread.exitCode === null)
      .filter(thread => thread.signalCode === null)
      .forEach(thread => thread.send(Object.values(args)))
    
    super.emit(...args)
  }
  
  removeThread(thread) {
    this.threads = this.threads
      .map(thread => thread.removeTrackedListeners())
      .filter(_thread => _thread.pid !== thread.pid)
  }
}

class ThreadBus extends EventEmitter {
  #on = true

  constructor() {
    super()
    this.pid = process.pid

    process.on('message', args => {
      this.#on && args.pid === this.pid 
        ? super.emit(...args)
        : 0
    })
  }

  emit(...args) {
    if (!process.connected || !this.#on)
      return null
    
    return process.send(Object.values(args))
  }
  
  async stop() {
    this.removeAllListeners()
    this.#on = false
    await setTimeout(1)
  }
}

export { ThreadBus }

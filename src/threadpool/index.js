import cp from 'node:child_process'
import { availableParallelism as numCPUs } from 'node:os'
import { EventEmitter } from 'node:events'
import { emitWarning, argv } from 'node:process'

import { Thread } from './src/thread/index.js'
import { PrimaryBus, ThreadBus } from './src/bus/index.js'
import { isObject, isInteger, isString } from './src/validate/index.js'

class Threadpool extends EventEmitter {
  static readyTimeout = 300
  static killTimeout = 300

  #nextEmitIndex = 0

  #starting = false
  #stopping = false  

  get #started() {
    return this.threads.some(t => t.alive) && !this.#stopping
  }

  constructor(path = argv.at(-1), size = numCPUs() - 1,  env = {}) {
    super()

    Object.defineProperties(this, {
      readyTimeout: {
        value: isInteger(Threadpool.readyTimeout, 'readyTimeout'),
        writable : false, enumerable : false, configurable : false
      },

      killTimeout: {
        value: isInteger(Threadpool.killTimeout, 'killTimeout'),
        writable : false, enumerable : false, configurable : false
      },

      path: {
        value: isString(path, 'path'),
        writable : false, enumerable : false, configurable : false
      },

      size: {
        value: isInteger(size, 'size'),
        writable : false, enumerable : false, configurable : false
      },
      
      env: {
        value: isObject(env, 'env'),
        writable : false, enumerable : false, configurable : false
      },

      threads: {
        value: [], 
        writable : true, enumerable : true, configurable : false
      }
    })
  }
  
  async start() {
    if (this.#stopping)
      return emitWarning('start() ignored, startup in progress.')

    this.#starting = true

    const forks = []

    for (let i = 0; i < this.size; i++) {
      forks.push(await this.#forkThread(this.path, {
        stdio: ['ipc', 'pipe', 'pipe'],
        env: { ...process.env, ...this.env, index: i }
      }))
    }

    this.threads = Object.freeze(forks)

    this.#starting = false

    return this.threads
  }

  async stop() {
    if (this.#stopping)
      return emitWarning('stop() ignored, shutdown in progress.')

    this.#stopping = true

    const alive = this.threads.filter(thread => thread.alive), 
          deaths = alive.map(thread => thread.kill())
    
    const exits = await Promise.all(deaths)

    this.#stopping = false

    return exits
  }
  
  emit(eventName, data) {
    const next = this.#getNextThread()
    
    next.emit(eventName, data)

    super.emit(eventName, data)
    
    return this
  }
  
  on(eventName, listener) {
    this.threads.forEach(thread => thread.bus.on(eventName, listener))
    
    super.on(eventName, listener)
    
    return this
  }
  
  once(eventName, listener) {
    const once = (...args) => {
      this.threads.forEach(thread => thread.bus.off(eventName, once))

      return listener(...args)
    }

    this.threads.forEach(thread => thread.bus.once(eventName, once))

    super.on(eventName, listener)

    return this
  }
  
  off(eventName, listener) {
    this.threads.forEach(thread => thread.bus.off(eventName, listener))
    
    return this
  }
  
  removeAllListeners(eventName) {
    this.threads.forEach(thread => 
      thread.bus.removeAllListeners(eventName))
    
    super.removeAllListeners(eventName)
    
    return this
  }
  
  #getNextThread() {
    this.#nextEmitIndex = this.#nextEmitIndex < Number.MAX_SAFE_INTEGER 
      ? this.#nextEmitIndex
      : 0

    return this.threads[++this.#nextEmitIndex % this.threads.length]
  }
  
  async #forkThread (path, args) {
    const thread = new Thread(
      cp.fork(path, args), {
      readyTimeout: this.readyTimeout,
      killTimeout: this.killTimeout
    })

    thread.once('thread-error', this.#onThreadError.bind(this))

    thread.stdout.on('data', data => console.log(data.toString()))    
    thread.stderr.on('data', data => {
      const message = data.toString().trim()

      message.toLowerCase().includes('simulated') 
        ? console.log('info: simulated test error thrown')
        : console.error(message)
    })
        
    await thread.ready()

    return thread
  }
  
  // @FIXME emit error instead stop remapping
  async #onThreadError(err) {
    if (!this.#started) 
      return 
    
    await this.stop()

    this.emit('thread-error', err)
  }
}

const primary = process.env.index 
  ? new ThreadBus({ 
    killTimeout: Threadpool.killTimeout, 
    readyTimeout: Threadpool.readyTimeout 
  }) 
  : false

export { Threadpool, primary }

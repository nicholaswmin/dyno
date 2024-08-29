import cp from 'node:child_process'
import { availableParallelism } from 'node:os'
import { EventEmitter } from 'node:events'
import { emitWarning, argv } from 'node:process'

import { Thread } from './src/thread/index.js'
import { PrimaryBus, ThreadBus } from './src/bus/index.js'
import { isObject, isInteger, isString } from './src/validate/index.js'

class Threadpool extends EventEmitter {
  static readyTimeout = 250
  static killTimeout  = 250

  #starting  = false
  #stopping  = false  
  #nextIndex = 0

  get #started() {
    return this.threads.some(t => t.alive) && !this.#stopping
  }

  constructor(path = argv.at(-1), size = availableParallelism(),  env = {}) {
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
    const exits = thread => thread.exitCode,
          alive = this.threads.filter(thread => thread.alive) 

    if (this.#stopping) {
      emitWarning('stop() ignored, shutdown in progress.')

      return this.threads.map(exits)
    }

    this.#stopping = true

    const deaths = alive.map(thread => thread.kill())
    
    await Promise.all(deaths)

    this.#stopping = false

    return this.threads.map(exits)
  }
  
  emit(name, data) {
    const thread = this.#nextThread()

    super.emit(name, data)
    
    return thread.emit(name, data)
  }
  
  broadcast(...args) {
    return Promise.all(
      this.threads.map(thread => thread.bus.emit(...args))
    )
  }
  
  on(name, listener) {
    this.threads.forEach(thread => thread.bus.on(name, listener))
    
    return this
  }
  
  once(name, listener) {
    const once = (...args) => {
      this.threads.forEach(thread => thread.bus.off(name, once))

      return listener(...args)
    }

    this.threads.forEach(thread => thread.bus.once(name, once))

    super.on(name, listener)

    return this
  }
  
  off(name, listener) {
    this.threads.forEach(thread => thread.bus.off(name, listener))
    
    return this
  }
  
  removeAllListeners(name) {
    this.threads.forEach(thread => 
      thread.bus.removeAllListeners(name))
    
    super.removeAllListeners(name)
    
    return this
  }
  
  #nextThread() {
    this.#nextIndex = this.#nextIndex < Number.MAX_SAFE_INTEGER 
      ? this.#nextIndex : 0

    return this.threads[++this.#nextIndex % this.threads.length]
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
        ? console.info('ignored simulated test error')
        : console.error(message)
    })
        
    await thread.ready()

    return thread
  }

  #onThreadError(err) {
    return this.#started 
      ? this.stop()
        .then(() => {
          this.emit('pool-error', err)
        })
        .catch(nexterr => {
          this.emit('pool-error', new Error(nexterr, { 
            cause: err 
          }))
          
          return Promise.resolve()
        })
      : false
  }
}

const primary = process.env.index 
  ? new ThreadBus({ 
    killTimeout: Threadpool.killTimeout, 
    readyTimeout: Threadpool.readyTimeout 
  }) 
  : false

export { Threadpool, primary }

import cp from 'node:child_process'
import { availableParallelism } from 'node:os'
import { EventEmitter } from 'node:events'
import { emitWarning, argv } from 'node:process'

import { Thread } from './src/thread/index.js'
import { PrimaryBus, ThreadBus } from './src/bus/index.js'
import { isObject, isInteger, isString } from './src/validate/index.js'

class Threadpool extends EventEmitter {
  static readyTimeout = 300
  static killTimeout = 300

  #pingCounter = 0

  #starting = false
  #stopping = false  

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
    if (this.#stopping)
      return emitWarning('stop() ignored, shutdown in progress.')

    this.#stopping = true

    const alive = this.threads.filter(thread => thread.alive), 
          exits = []
    
    for (const thread of alive)
      exits.push(await thread.kill())

    this.#stopping = false

    return exits
  }
  
  ping(data = {}) {
    const next = this.threads[++this.#pingCounter % this.threads.length]

    next.emit('ping', data)
  }
  
  async #forkThread (path, args) {
    const thread = new Thread(
      cp.fork(path, args), {
      readyTimeout: this.readyTimeout,
      killTimeout: this.killTimeout
    })

    thread.once('thread-error', this.#onThreadError.bind(this))
    thread.on('pong', (...args) => this.emit('pong', ...args))

    thread.stdout.on('data', data => console.log(data.toString()))    
    thread.stderr.on('data', data => {
      const message = data.toString().trim()

      message.toLowerCase().includes('simulated') 
        ? console.log('info: simulated test error thrown')
        : console.error(message)
    })
        
    await thread.bus.readyHandshake()

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

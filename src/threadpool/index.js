import cp from 'node:child_process'
import { availableParallelism } from 'node:os'
import { EventEmitter, once } from 'node:events'

import { Thread } from './src/thread/index.js'
import { PrimaryBus, ThreadBus } from './src/bus/index.js'
import { 
  validateObject, 
  validateInteger, 
  validateString 
} from './src/validate/index.js'

class Threadpool extends EventEmitter {
  static readyTimeout = 300
  static killTimeout = 300
  
  #threadEvents = ['pong']
  #stopping = false
  #nextIndex = 0
  
  get #started() {
    return this.threads.length === this.size &&
      this.threads.some(t => t.exitCode === null)
  }

  constructor(
    modulePath = process.argv.at(-1), 
    size = availableParallelism(), 
    parameters = {}) {
    super()

    Object.defineProperties(this, {
      readyTimeout: {
        value: validateInteger(Threadpool.readyTimeout, 'readyTimeout'),
        writable : false, enumerable : false, configurable : false
      },

      killTimeout: {
        value: validateInteger(Threadpool.killTimeout, 'killTimeout'),
        writable : false, enumerable : false, configurable : false
      },

      modulePath: {
        value: validateString(modulePath, 'modulePath'),
        writable : false, enumerable : false, configurable : false
      },

      size: {
        value: validateInteger(size, 'size'),
        writable : false, enumerable : false, configurable : false
      },
      
      parameters: {
        value: validateObject(parameters, 'parameters'),
        writable : false, enumerable : false, configurable : false
      },

      threads: {
        value: [], 
        writable : true, enumerable : true, configurable : false
      }
    })
  }
  
  async start() {
    const forks = []

    for (let i = 0; i < this.size; i++) {
      forks.push(await this.#forkThread(this.modulePath, {
        env: {  ...process.env, ...this.parameters, index: i  }
      }))
    }

    this.threads = Object.freeze(forks)

    return this
  }

  async stop() {
    this.#stopping = true

    const alive = thread => thread.alive, 
          kill  = thread => thread.kill(),
          kills = this.threads.filter(alive)
    
    return Promise.all(kills.map(t => t.kill()))
      .finally(() => this.#stopping = false)
  }
  
  ping(data = {}) {
    const thread = this.threads[++this.#nextIndex % this.threads.length]

    thread.emit('ping', { start: performance.now() })
  }
  
  pingTest(data = {}) {
    // @NOTE ensure the module task file imports the { primary }
    if (!this.pingSetup) {
      this._pCount = 0
      this._pRTT = 0

      this.threads.forEach(thread => {
        thread.on('pong', data => {
          this._pRTT = performance.now() - data.start
          ++this._pCount
        })
      })
      
      setInterval(() => {
        console.log('Pongs:', this._pCount, '/ sec.', 'RTT:', this._pRTT, 'ms')
        this._pCount = 0
      }, 1000)
      
      this.pingSetup = true
    }
    
    this.ping(data)
  }
  
  async #forkThread (modulepath, args) {
    const thread = new Thread(
      cp.fork(modulepath, args), {
      readyTimeout: this.readyTimeout,
      killTimeout: this.killTimeout
    })

    this.#threadEvents.forEach(e => thread.on(e, d => this.emit(e, d)))

    if (thread.stdout)
      thread.stdout.on('data', data => console.log(data.toString))
    
    if (thread.stderr)
      thread.stderr.on('data', data => console.error(data.toString))
    
    thread.once('thread-error', this.#onThreadError.bind(this))
      
    await thread.bus.isReady()

    return thread
  }
  
  
  // @FIXME emit error instead stop remapping
  async #onThreadError(err) {
    if (!this.#started || this.#stopping)
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

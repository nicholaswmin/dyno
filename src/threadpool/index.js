import cp from 'node:child_process'
import { EventEmitter, once } from 'node:events'

import { Thread } from './src/thread/index.js'
import { PrimaryBus, ThreadBus } from './src/bus/index.js'
import { validInt, validObj, validStr } from './src/validate/index.js'

class Threadpool extends EventEmitter {
  #nextIndex = 0

  constructor(task = process.argv.at(-1), size = 4, parameters = {}) {
    super()

    Object.defineProperties(this, {
      task: {
        value: validStr(task, 'task'),
        writable : false, enumerable : false, configurable : false
      },
      size: {
        value: validInt(size, 'size'),
        writable : false, enumerable : false, configurable : false
      },
      parameters: {
        value: validObj(parameters, 'parameters'),
        writable : false, enumerable : false, configurable : false
      },
      exitTimeout: {
        value: validInt(50, 'exitTimeout'),
        writable : false, enumerable : false, configurable : false
      },
      threads: {
        value: [], 
        writable : true, enumerable : true, configurable : false
      }
    })
  }
  
  async start() {
    const spawns = Array.from({
      length: this.size 
    }, (_, i) => this.#fork(this.task, { parameters: this.parameters, i }))

    this.threads = Object.freeze(await Promise.all(spawns))
    
    return this
  }
  
  async stop() {
    const exitCodes = await this.#exit()
    const isNonZero = code => code > 0

    return exitCodes.some(isNonZero) ? (() => {
        throw new Error('nonzero exits')
      })() : exitCodes
  }
  
  ping() {
    const thread = this.threads[++this.#nextIndex % this.threads.length]

    thread.emit('ping')
  }
  
  async #fork (task, { parameters, i  }) {
    const fork = cp.fork(task, ['child'], {
      env: { ...process.env, parameters: JSON.stringify(parameters), index: i }
    })
      
    await Promise.race([ 
      once(fork, 'error'),
      once(fork, 'spawn') 
    ])
    .then(([err]) => err 
      ? Promise.reject(err) 
      : null
    )
    
    return (new Thread(fork))
      .once('end', this.#onThreadEnd.bind(this))
      .on('pong', this.#onThreadPong.bind(this))
  } 
  
  async #exit() {
    const isAlive = thread => thread.alive, 
          exit    = thread => thread.exit()

    return Promise.all(this.threads.filter(isAlive).map(exit))
  }
  
  async #onThreadEnd(err) {
    this.emit('end', err ? await this.stop() : null)
  }
  
  async #onThreadPong(args) {
    this.emit('pong')
  }
}

const primary = process.env.index ? new ThreadBus() : {}

export { Threadpool, primary }

import cp from 'node:child_process'
import { env } from 'node:process'
import { setTimeout } from 'node:timers/promises'
import { EventEmitter, once } from 'node:events'

import { validInt, validObj, validStr } from './validate.js'
import { Thread } from './src/thread/index.js'
import { ThreadBus } from './src/bus/index.js'

// @TODO provide message sending methods
class Threadpool extends EventEmitter {
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
    
    return this.threads
  }
  
  async stop() {
    const exitCodes = await this.#exit()
    const isNonZero = code => code > 0

    return exitCodes.some(isNonZero) ? (() => {
        throw new Error('nonzero exits')
      })() : exitCodes
  }
  
  ping() {
    // @FIXME
    // This change must happen on the bus-level - and 
    // the bus should be kept on each thread.
    /*
    const child = this.threads[++this.#lastPingdex % this.threads.length]
    
    child.connected
      ? this.#bus.emit('ping', { from: process.pid }) 
      : emitWarning('cannot ping: child disconnected')
     */ 
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
  } 
  
  async #exit() {
    const isAlive = thread => thread.alive, 
          exit    = thread => thread.exit()

    return Promise.all(this.threads.filter(isAlive).map(exit))
  }
  
  async #onThreadEnd(err) {
    this.emit('end', err ? await this.stop() : null)
  }
}

export { Threadpool }

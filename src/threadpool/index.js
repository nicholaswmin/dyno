import cp from 'node:child_process'
import { emitWarning, env } from 'node:process'
import { setTimeout } from 'node:timers/promises'
import { EventEmitter, once } from 'node:events'

import { validInt, validObj, validStr } from './validate.js'
import { PrimaryBus, ChildBus } from './bus/index.js'

// @TODO provide message sending methods
class Threadpool extends EventEmitter {
  #lastPingdex = 0
  #bus = new PrimaryBus()

  constructor(task = process.argv.at(-1), count = 4, parameters = {}) {
    super()

    Object.defineProperties(this, {
      task: {
        value: validStr(task, 'task'),
        writable : false, enumerable : false, configurable : false
      },
      count: {
        value: validInt(count, 'count'),
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
    const children = Array.from({ length: this.count }, (_, i) => 
      this.#fork(this.task, { parameters: this.parameters, i })
    )

    this.threads = Object.freeze(await Promise.all(children))
    
    return this.threads
  }
  
  async stop() {
    // @REVIEW needed?
    //this.removeAllListeners()
    const exitCodes = await this.#killAliveChildren()
    
    return exitCodes.some(code => code > 0) 
      ? Promise.reject(new Error('Some threads exited with nonzero')) 
      : Promise.resolve(exitCodes)
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
    const child = cp.fork(task, ['child'], {
      env: { 
        ...env, 
        SPAWN_INDEX: i,
        parameters: JSON.stringify(parameters) 
      }
    })
    .once('exit', this.#handleChildExit.bind(this))
    .once('error', this.#handleChildError.bind(this))

    await once(child, 'spawn') 

    return child
  } 
  
  async #killAliveChildren() {
    return Promise.all(
      this.threads
        .filter(this.#isAlive)
        .map(this.#killChild.bind(this))
    )
  }
  
  async #killChild(child) {
    const [ winner ] = await Promise.race([
      this.#startKillTimeout(),
      this.#attemptChildExit(child)
    ])

    return ['KILL_TIMEOUT'].includes(winner) 
      ? this.#forceKillChild(child).then(v => 1)
      : 0
  }
  
  async #forceKillChild(child) {
    queueMicrotask(() => child.kill('SIGKILL'))

    return this.#waitUntilDead(child)
  }
  
  #attemptChildExit(child) {
    queueMicrotask(() => child.connected ? child.send('exit'): child)
    
    return this.#waitUntilDead(child)
  }
  
  #waitUntilDead(child) {
    child.removeAllListeners()

    return this.#isAlive(child)
      ? Promise.race([
        once(child, 'exit'),  
        once(child, 'error'),
        once(child, 'close')
      ]) : child
  }
  
  #isAlive(child) {
    return [child.exitCode, child.signalCode]
      .every(val => val === null)
  }
  
  async #startKillTimeout() {
    await setTimeout(this.exitTimeout)
    
    return ['KILL_TIMEOUT']
  }
  
  #handleChildExit(code) {
    // @TODO check for `signalCode` too ?
    return code > 0 
      ? this.#handleChildError(new Error('child exited with non-zero code')) 
      : null
  }
  
  async #handleChildError(err = '') {
    await this.#killAliveChildren()

    this.emit('error', err instanceof Error ? err : new Error(err))

    this.removeAllListeners()
  }
}

export { Threadpool, ChildBus }

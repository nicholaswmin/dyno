import t from 'node:timers/promises'
import child_process from 'node:child_process'
import { EventEmitter, once } from 'node:events'
import { validateInt, validateObj, validateIfString } from './validate.js'
import { queryObjects } from 'node:v8'

// @TODO provide message sending methods

class Threadpool extends EventEmitter {
  constructor(task = process.argv.at(-1), threadCount = 4, parameters = {}) {
    super()

    Object.defineProperties(this, {
      task: {
        value: validateIfString(task, 'task'),
        writable : false, enumerable : false, configurable : false
      },
      threadCount: {
        value: validateInt(threadCount, 'thread_count'),
        writable : false, enumerable : false, configurable : false
      },
      parameters: {
        value: validateObj(parameters, 'parameters'),
        writable : false, enumerable : false, configurable : false
      },
      exitTimeout: {
        value: validateInt(250, 'exitTimeout'),
        writable : false, enumerable : false, configurable : false
      },
      threads: {
        value: [], 
        writable : true, enumerable : false, configurable : false
      }
    })
  }
  
  async start() {
    const children = Array.from({ length: this.threadCount }, (_, index) => 
      this.#fork(this.task, { parameters: this.parameters, index })
    )

    this.threads = Object.freeze(await Promise.all(children))

    return this.threads
  }
  
  async stop() {
    // @REVIEW needed?
    //this.removeAllListeners()
    return await this.#killAliveChildren()
  }
  
  async #fork (task, { index, parameters }) {
    const child = child_process.fork(task, {
      env: {  
        ...process.env, 
        CHILD_INDEX: index, 
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
      ? this.#forceKillChild(child) : child
  }
  
  #forceKillChild(child) {
    process.nextTick(() => child.kill('SIGKILL') )

    return this.#waitUntilDead(child)
  }
  
  #attemptChildExit(child) {
    process.nextTick(() => 
      child.connected 
      ? child.send('exit')
      : child)
    
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
    await t.setTimeout(this.exitTimeout)
    
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

export default Threadpool

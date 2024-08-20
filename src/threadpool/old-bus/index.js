import { ChildProcess } from 'node:child_process'
import { EventEmitter, once, getEventListeners } from 'node:events'
import { DiscreetEmitter } from './discreet-emitter/index.js'
import { setImmediate, setTimeout } from 'node:timers/promises'
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

class InteractableChild extends ChildProcess {
  #endEvents = ['close', 'exit', 'error']
  constructor(childProcess) {
    super(childProcess)
    this.exitTimeout = 4000
    this.pid = childProcess.pid // fix
  
    // attach all worker evens 
    // if any fires, ditch all listeners
    // listen for remove listener, remove listener
    // /
    return Object.assign(this, childProcess)
  }
  
  async terminate() {
    const [ winner ] = await Promise.race([
      this.#startKillTimeout(),
      this.#attemptChildExit(this)
    ])

    return ['KILL_TIMEOUT'].includes(winner) 
      ? this.#forceKillChild(this).then(v => 1)
      : 0
  }
  
  #end() {
    //this.removeAllListeners()
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
    queueMicrotask(() => child.connected 
      ? child.send('exit'): child)
    
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
}



class ChildBus extends EventEmitter {
  #on = true

  constructor() {
    super()
    this.pid = process.pid

    process.on('message', args => {
      this.#on && args.pid === this.pid 
      ? super.emit(...args) : 0
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

export { InteractableChild, ChildBus }

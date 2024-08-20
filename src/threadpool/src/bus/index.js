import { EventEmitter, once, getEventListeners } from 'node:events'
import { emitWarning } from 'node:process'
import { validChildProcess, validStr } from '../validate/index.js'

class Bus extends EventEmitter {
  #emittedWarnings = {}
  #stopped = false

  constructor(name = 'bus') {
    super()
    this.name = validStr(name, 'name')
    
    process.on('disconnect', () => this.stop())
  }
  
  stop() {
     this.#stopped = true
     this.removeAllListeners()
   }  
   
  cannotEmit() {
    if (this.#stopped)
      this.emitWarning('cannot emit() on stopped bus')
    
    if (Object.hasOwn(process, 'connected') && process.connected === false) 
      this.emitWarning('cannot emit(), process disconnected')
    
    return this.#stopped
  }
  
  cannotReceive() {
    if (Object.hasOwn(process, 'send') && this.#stopped)
      this.emitWarning('cannot emit() on stopped bus')
    
    return this.#stopped
  }

  emitWarning(text = '', type) {
    validStr(text, 'text')

    if (typeof text !== 'string' || !text.length)
      throw new RangeError('arg. "text" must be a string with length')

    if (!!this.#emittedWarnings[text])
      return
    
    emitWarning(`${this.name}: ${text}`, type)
    
    this.#emittedWarnings[text] = true
  }
}

class PrimaryBus extends Bus {
  constructor(cp) {
    super('primary')
    
    validChildProcess(cp, 'cp')
    
    this.cp = cp    
    this.cp.connected 
      ? this.cp.on('message', args => {
        super.emit(args[0], { ...args[1], pid: args[2] })
      })
      : this.emitWarning('cannot listen cp.on(), cp disconnected.')
  }
  
  emit(...args) {
    if (this.cannotEmit()) 
      return

    return this.cp.connected 
      ? this.cp.send(Object.values({ ...args, pid: this.cp.pid }))
      : this.emitWarning('cant emit(), thread disconnected')
  }
}

class ThreadBus extends Bus {
  constructor() {
    super('child')
    this.pid = process.pid

    process.on('message', args => {
      this.cannotReceive()
        ? null : args.at(-1) === this.pid
          ? super.emit(args[0], args[1], args[2]) : null
    })
  }

  emit(...args) {
    if (this.cannotEmit()) 
      return

    return process.send(Object.values({ ...args, pid: this.pid }))
  }
}

export { PrimaryBus, ThreadBus }

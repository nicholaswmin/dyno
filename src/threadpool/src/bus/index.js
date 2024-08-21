import { EventEmitter } from 'node:events'
import { emitWarning } from 'node:process'

import { validateChildProcess, validateString } from '../validate/index.js'

class Bus extends EventEmitter {
  #emittedWarnings = {}

  constructor(name = 'bus') {
    super()
    this.name = validateString(name, 'name')
    this.stopped = false
    
    process.on('disconnect', () => this.stop())
  }
  
  stop() {
     this.stopped = true
     this.removeAllListeners()
   } 

  canEmit() {
    if (this.stopped)
      this.emitWarning('cannot emit(), Bus was stopped')

    return !this.stopped
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

    this.cp = validateChildProcess(cp, 'cp')    
    
    if (this.canListen())
      this.cp.on('message', args => {
        super.emit(args[0], { ...args[1], pid: args[2]})
      })
  }
  
  canEmit() {
    if (Object.hasOwn(process, 'connected') && process.connected === false)  {
      this.emitWarning('cannot emit(), process disconnected')

      return false
    }

    return !this.stopped
  }
  
  canListen() {
    if (!this.cp.connected) {
      this.emitWarning('cannot process.on(), process disconnected')

      return false
    }
    
    return true
  }
  
  emit(...args) {
    if (!this.canEmit())
      return false

    this.cp.send(Object.values({ ...args, pid: this.cp.pid }))
  }
}

class ThreadBus extends Bus {
  constructor() {
    super('child')
    this.pid = process.pid

    process.on('message', args => {

      if (this.canListen() && args.at(-1) === this.pid)
        super.emit(args[0], args[1], args[2]) 
    })
  }
  
  canListen() {
    if (!process.connected) {
      this.emitWarning('cannot process.on(), process disconnected')
      
      return false
    }
    
    return true
  }

  emit(...args) {
    if (!this.canEmit()) 
      return false
    
    return process.send(Object.values({ ...args,  pid: this.pid }))
  }
}

export { PrimaryBus, ThreadBus }

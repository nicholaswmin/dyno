import { EventEmitter } from 'node:events'
import { emitWarning } from 'node:process'

import { 
  validateChildProcess, 
  validateString,
  validateInteger
} from '../validate/index.js'

class Bus extends EventEmitter {
  #emittedWarnings = {}

  constructor(name = 'bus') {
    super()
    this.name = validateString(name, 'name')
    this.stopped = false
  }
  
  stop() {
     this.stopped = true
     this.removeAllListeners()
   } 

  canEmit() {
    if (this.stopped)
      return false

    return !this.stopped
  }

  emitWarning(text = '', type) {
    validateString(text, 'text')

    if (typeof text !== 'string' || !text.length)
      throw new RangeError('arg. "text" must be a string with length')

    if (!!this.#emittedWarnings[text])
      return
    
    emitWarning(`${this.name}: ${text}`, type)
    
    this.#emittedWarnings[text] = true
  }
}

class PrimaryBus extends Bus {
  constructor(cp, { readyTimeout, killTimeout }) {
    super('primary')
    this.readyTimeout = validateInteger(readyTimeout, 'readyTimeout')
    this.killTimeout = validateInteger(killTimeout, 'killTimeout')
    this.ready = false
    this.cp = validateChildProcess(cp, 'cp')
    
    this.on('ready-ping', args => this.ready = true)

    if (this.canListen())
      this.cp.on('message', args => 
        super.emit(args.at(0), { 
          ...args.at(1), 
          pid: args.at(-1) 
        }))
  }
  
  canEmit() {
    return !this.stopped && this.cp.connected
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

    this.cp.send(Object.values({ ...args, pid: process.pid }))
  }
  
  attemptReadyHandshake() {
    if (this.ready) 
      return resolve()

    return new Promise((resolve, reject) => {
      let readyTimer = setTimeout(() => {
        const self = this
        const errmsg = 'Thread did not reply to "ready-ping" within timeout.'

        const exit = err => {
          clearTimeout(sigkillTimer)
          self.cp.off('exit', onExitEvent)
          reject(err)
        }

        const onTimeout = () => 
          exit(new Error(`${errmsg} Cleanup by SIGKILL timed-out.`))

        const onExitEvent = () => 
          exit(new Error(`${errmsg} Cleanup by SIGKILL succeeded.`))

        const sigkillTimer = setTimeout(onTimeout, this.killTimeout)

        this.cp.once('exit', onExitEvent)
        
        if (!this.cp.kill(9))
          reject(new Error(`${errmsg} Failed to send SIGKILL cleanup signal.`))
      }, this.readyTimeout)

      this.on('ready-pong', err => {
        clearTimeout(readyTimer)
        resolve()
      })
      
      this.emit('ready-ping')
    })
  }
}

class ThreadBus extends Bus {
  constructor({ readyTimeout }) {
    super('child')
    this.pid = process.pid
    this.error = false
    this.readyTimeoutTimer = setTimeout(() => {
      console.warn('ThreadBus(): exiting 1, PID:', this.pid)
      process.exit(1)
    }, validateInteger(readyTimeout, 'readyTimeout'))

    process.on('message', args => {
      if (!this.canListen())
        return

      if (this.error)
        return
        
      if (Array.isArray(args) && args.at(0) === 'ready-ping') {
        clearTimeout(this.readyTimeoutTimer)
        this.emit('ready-pong', {})        
      }

      super.emit(...args) 
    })
    
    process.on('uncaughtException', error => {
      this.error = error.toString()
      throw error
    })
    
    this.on('ping', data => setImmediate(() => this.emit('pong', data)))
  }
  
  stop() {
    super.stop()
    process.disconnect()
  }

  canListen() {
    if (!process.connected)
      this.emitWarning('cannot process.on(), process disconnected')
    
    return process.connected
  }

  emit(...args) {
    if (!this.canEmit()) 
      return false
    
    return process.send(Object.values({ ...args,  pid: process.pid }))
  }
}

export { PrimaryBus, ThreadBus }

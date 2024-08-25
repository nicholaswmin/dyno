import { EventEmitter } from 'node:events'
import { emitWarning } from 'node:process'

import { aChildProcess, aString, anInteger } from '../validate/index.js'

class Bus extends EventEmitter {
  #emittedWarnings = {}

  constructor(name = 'bus') {
    super()
    this.name = aString(name, 'name')
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
    aString(text, 'text')

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
    this.readyTimeout = anInteger(readyTimeout, 'readyTimeout')
    this.killTimeout = anInteger(killTimeout, 'killTimeout')
    this.ready = false
    this.cp = aChildProcess(cp, 'cp')
    
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
        const errmsg = 'thread did not reply to "ready-ping" within timeout.'

        this.emitWarning(errmsg, 'handshake')
        
        const exit = err => {
          clearTimeout(sigkillTimer)
          self.cp.off('exit', onExitEvent)
          reject(err)
        }

        const onTimeout = () => 
          exit(new Error(`${errmsg} SIGKILL cleanup timed-out.`))

        const onExitEvent = () => 
          exit(new Error(`${errmsg} SIGKILL cleanup succeeded.`))

        const sigkillTimer = setTimeout(onTimeout, this.killTimeout)

        this.cp.once('exit', onExitEvent)
        
        if (!this.cp.kill(9))
          reject(new Error(`${errmsg} SIGKILL cleanup failed.`))
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
      this.emitWarning(`did not get "ready-ping" within timeout`, 'handshake')
      process.exit(1)
    }, anInteger(readyTimeout, 'readyTimeout'))

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

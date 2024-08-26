import { EventEmitter } from 'node:events'
import { emitWarning } from 'node:process'

import { isChildProcess, isInteger, isString } from '../validate/index.js'

class Bus extends EventEmitter {
  #emittedWarnings = {}

  constructor(name = 'bus') {
    super()
    this.name = isString(name, 'name')
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
  
  isBusMessage(args) {
    return args && Array.isArray(args) && args.includes('bus')
  }

  emitWarning(text = '', type) {
    isString(text, 'text')

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
    this.readyTimeout = isInteger(readyTimeout, 'readyTimeout')
    this.killTimeout = isInteger(killTimeout, 'killTimeout')
    this.ready = false
    this.cp = isChildProcess(cp, 'cp')
    
    this.on('ready-ping', args => this.ready = true)

    if (this.canListen())
      this.cp.on('message', args => {
        if (!this.isBusMessage(args))
          return

        super.emit(args.at(0), { 
          ...args.at(1), 
          pid: args.at(-1) 
        })
      })
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

    this.cp.send(Object.values({ 
      ...args, from: 'bus', pid: process.pid 
    }))
  }
  
  readyHandshake() {
    if (this.ready) 
      return resolve()

    return new Promise((resolve, reject) => {
      let readyTimer = setTimeout(() => {
        const self = this
        const errmsg = 'no "ready-ping" within timeout. Sending SIGKILL.'

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
      this.emitWarning(`"ready-ping" timeout, exiting with: 1`, 'handshake')
      process.exit(1)
    }, isInteger(readyTimeout, 'readyTimeout'))
    
    process.on('message', args => {
      if (!this.isBusMessage(args))
        return

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
    
    return process.send(Object.values({ 
      ...args, from: 'bus', pid: process.pid 
    }))
  }
}

export { PrimaryBus, ThreadBus }

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
  
  constructBusMessage(...args) {
    return Object.values({ ...args, from: 'bus', pid: process.pid })
  }
  
  isBusMessage(args) {
    return args && Array.isArray(args) && args.includes('bus')
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

        super.emit(args.at(0), { ...args.at(1), pid: args.at(-1) })
      })
  }
  
  canEmit() {
    return !this.stopped && this.cp.connected
  }
  
  canListen() {
    return this.cp.connected
  }
  
  emit(...args) {
    return new Promise((resolve, reject) => {
      if (!this.canEmit())
        return resolve(false)

      const sent = this.cp.send(this.constructBusMessage(...args), err => {    
        if (err) return reject(err)
      })
      
      process.nextTick(() => {
        sent ? resolve(true) : reject(new Error('IPC rate exceeded.'))
      })
    })
  }
  
  readyHandshake() {
    if (this.ready) 
      return resolve()

    return new Promise((resolve, reject) => {
      let readyTimer = setTimeout(() => {
        const errmsg = 'no "ready-ping" within timeout. Sending SIGKILL.'

        const exit = err => {
          clearTimeout(sigkillTimer)
          this.cp.off('exit', onExitEvent)
          reject(err)
        }

        const onTimeout = () => 
          exit(new Error(`${errmsg} SIGKILL cleanup timed-out.`))

        const onExitEvent = () => 
          exit(new Error(`${errmsg} SIGKILL cleanup succeeded.`))

        const sigkillTimer = setTimeout(onTimeout, this.killTimeout)

        this.cp.once('exit', onExitEvent)
        
        if (!this.cp.kill(9))
          reject(new Error(`${errmsg} SIGKILL cleanup signal failed.`))
      }, this.readyTimeout)

      this.on('ready-pong', err => {
        clearTimeout(readyTimer)

        return resolve()
      })
      
      return this.emit('ready-ping').catch(reject)
    })
  }
}

class ThreadBus extends Bus {
  constructor({ readyTimeout }) {
    super('thread')
    this.pid = process.pid
    this.error = false
    this.readyTimeoutTimer = setTimeout(() => {
      emitWarning(`"ready-ping" timeout, exiting code: 1`, 'handshake')
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
    return process.connected
  }

  emit(...args) {
    if (!this.canEmit()) 
      return false
    
    return process.send(this.constructBusMessage(...args))
  }
}

export { PrimaryBus, ThreadBus }

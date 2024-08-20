import { EventEmitter } from 'node:events'

class ThreadBus extends EventEmitter {
  #on = true

  constructor() {
    super()
    this.pid = process.pid

    process.on('message', args => {
      this.#on && args.pid === this.pid 
        ? super.emit(...args)
        : 0
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

export { ThreadBus }

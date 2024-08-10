import { EventEmitter } from 'node:events'
import process from '../process/index.js'

class Bus {
  constructor({ event = 'histogram:recorded' } = {}) {
    this.event = event

    this.threads = {}
    this.on = true
    this.ee = new EventEmitter()
  }
  
  listen(threads, cb) {
    this.threads = threads

    this.ee.on(
      this.event, 
      json => this.on
        ? cb(Object.freeze(JSON.parse(json))) 
        : null
    )

    Object.values(this.threads).forEach(thread => { 
      thread.on('message', ({ name, json }) => {
        return this.on && name === this.event 
          ? cb(Object.freeze(JSON.parse(json))) 
          : null
      })
    })
  }

  emit(object) {
    if (!this.on)
      return process.emitWarning('attempted to emit() on a stopped Bus')
    
    const json = JSON.stringify(object)

    this.ee.emit(this.event, json)

    process.send({ name: this.event, json })
  }
  
  start() {
    this.on = true
  }
  
  stop() {
    this.on = false
    this.ee.removeAllListeners(this.event)
    Object.values(this.threads)
      .forEach(thread => thread.removeAllListeners(this.event))
    this.threads = {}
  }
}

const bus = new Bus()

export default () => bus

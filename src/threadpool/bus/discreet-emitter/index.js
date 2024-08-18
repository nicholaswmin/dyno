import { EventEmitter, getEventListeners } from 'node:events'
import { randomUUID }  from 'node:crypto'

// "Discreet" in the way that it provides an easy API to 
// only remove it's "own" event handlers, being careful 
// not to meddle with event handlers set elsewhere. 
// Correctly removing specific event handlers is tricky, 
// this provides a straightforward API: `ee.removeTrackedListeners`.

class DiscreetEmitter extends EventEmitter {
  constructor(eventEmitter = {}) {
    super()
    this.id = randomUUID()

    Object.assign(this, eventEmitter)
  }
  
  on(event, fn) {
    this.#trackOwnListener(fn)
    
    return super.on(event, fn)
  }
  
  once(event, fn) {
    this.#trackOwnListener(fn)
    
    return super.once(event, fn)
  }
  
  removeTrackedListeners() {
    this.#getTrackedListeners()
      .forEach(({ event, listener }) => 
        this.removeListener(event, listener))

    return this
  }
  
  #getTrackedListeners() {
    return this.eventNames()
      .map(name => getEventListeners(this, name)
      .filter(fn => typeof fn._ee_id !== 'undefined' && fn._ee_id === this.id)
      .map(fn => ({ event: name, listener: fn, name: fn.name })))
      .flat()
  }
  
  #trackOwnListener(fn) {
    fn._ee_id = this.id
    
    return fn
  }
}

export { DiscreetEmitter }

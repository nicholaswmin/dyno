import { createHistogram } from 'node:perf_hooks'
import RingBuffer from '../ring-buffer/index.js'

const round = num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'n/a'

class HistogramsList {
  constructor({ pid, name, value }) {
    this.pid = pid
    this.createTimeseriesHistogram({ name, value })
  }
  
  createTimeseriesHistogram({ name, value }) {
    Object.defineProperty(this, name, {
      value: new TimeseriesHistogram({ name, initialValue: value }),
      configurable: false,
      enumerable: true,
      writable: false
    })
  }
}

class RecordableHistogram  {
  #histogram = createHistogram()

  constructor() {
    Object.keys(this.#histogram.toJSON())
      .filter(prop  => typeof prop !== 'object')
      .forEach(prop => Object.defineProperty(this, prop, { 
        enumerable: true,
        get() { return this.#histogram[prop] }
    }))
  }

  record(value) {
    return this.#histogram.record(value)
  }
  
  recordDelta() {
    return this.#histogram.recordDelta()
  }
  
  reset() {
    return this.#histogram.reset()
  }

  toJSON() {
    return this.#histogram.toJSON()
  }
}

class TimeseriesHistogram extends RecordableHistogram {
  constructor({ name, initialValue = 1 }) {
    super()
    
    Object.defineProperty(this, 'name', { 
      value: name,
      enumerable: true,
      configurable: false, 
      writable: true
    })

    Object.defineProperty(this, 'last', { 
      value: 1,
      enumerable: true,
      configurable: false, 
      writable: true
    })

    Object.defineProperty(this, 'snapshots', { 
      value: new RingBuffer(),
      enumerable: true,
      configurable: false, 
      writable: false 
    })

    this.record(initialValue)
  }
  
  record(value) {
    super.record(value)
    this.last = value
    this.snapshots.push(this.toJSON())
  }
  
  toJSON() {
    return {
      ... { last: this.last },
      ...super.toJSON()
    }
  }
}

export default HistogramsList

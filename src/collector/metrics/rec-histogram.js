import { createHistogram } from 'node:perf_hooks'

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

export default RecordableHistogram

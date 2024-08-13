import { createHistogram } from 'node:perf_hooks'
import RingBuffer from '../ring-buffer/index.js'

const round = num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'n/a'

class Stats {
  constructor() {
    this.ppid = process.pid
    this.threads = this
    this.primary = {
      toUnit: unit => {
        return this.toHistogramsPids()
          .filter(key => this[key].pid === this.ppid)
          .map(key => this[key].toUnit(unit))
      }
    }
  }
  
  first() {
    return this.toList()
      .filter(h => h.pid !== this.ppid)[0]
  }
  
  toList() {
    return this.toHistogramsPids().map(pid => this[pid])
  }
  
  toUnit(unit = 'mean') {
    return this.toHistogramsPids()
      .filter(key => this[key].pid !== this.ppid)
      .map(key => this[key].toUnit(unit))
  }

  toHistogramUnit(unit = 'mean') {
    return this.toHistogramsPids()
      .filter(key => this[key].pid !== this.ppid)
      .map(key => this[key].toUnit(unit))
  }
  
  toHistogramsPids() {
    return Object.keys(this)
      .filter(key => this[key] instanceof HistogramsList)
  }
}

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
  
  toList() {
    return Object.keys(this)
      .filter(key => this[key] instanceof TimeseriesHistogram)
      .map(key => this[key])
  }
  
  toSnapshotUnit(unit) {
    return Object.keys(this)
      .filter(key => this[key] instanceof TimeseriesHistogram)
      .reduce((acc, key) => ({
        ...acc,
        [key]: this[key]['snapshots'].map(snap => round(snap[unit]))
      }), {})
  }
  
  toUnit(unit) {
    return Object.keys(this)
      .filter(key => this[key] instanceof TimeseriesHistogram)
      .reduce((acc, key) => ({
        ...acc,
        thread: 
        this.pid, 
        [key]: this[key].toRounded(unit)
      }), {})
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
  
  toRounded(unit) {
    return round(this[unit])
  }
  
  toRoundedSnapshot(unit) {
    return this.snapshots
      .map(snapshot => round(snapshot[unit]))
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

export { Stats, HistogramsList }

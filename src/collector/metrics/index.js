import RingBuffer from '../ring-buffer/index.js'
import RecordableHistogram from './rec-histogram.js'
import MetricsList from './metrics-list.js'

class MetricsGroup {
  constructor() {
    this.ppid = process.pid.toString()
  }
  
  trackMetricsForThread({ pid }) {
    this[pid] = new Metrics({ pid: pid.toString() })
  }
  
  getMetricsOfThread({ pid }) {
    return this[pid]
  }

  log() {
    return MetricsList.from(Object.values(this))
  }
}

class Metrics {
  constructor({ pid }) {
    this.pid = pid
  }
  
  getMetric({ name }) {
    return this[name]
  }
  
  addMetric({ pid, name, value }) {
    Object.defineProperty(this, name, {
      value: new Metric({ pid, name, initialValue: value }),
      configurable: false,
      enumerable: true,
      writable: false
    })
  }
}

class Metric extends RecordableHistogram {
  constructor({ pid, name, initialValue = 1 }) {
    super()

    Object.defineProperties(this, {
      name: {
        value: name,
        enumerable: true,
        configurable: false, 
        writable: true
      },
      
      last: {
        value: 1,
        enumerable: true,
        configurable: false, 
        writable: true
      },

      snapshots: {
        value: new RingBuffer(),
        enumerable: true,
        configurable: false, 
        writable: false 
      }
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
      ... { name: this.name },
      ... { last: this.last },
      ...super.toJSON()
    }
  }
}

export { MetricsGroup, Metrics, Metric }

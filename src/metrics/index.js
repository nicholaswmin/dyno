// Metrics 
// 
// - The exported `metric` emitter can be used to emit/record values. 
//   It can be used either locally or a `child process`; the emitted 
//   values are transmitted via a `Bus` which transparently works across 
//   process boundaries.
// 
// - This collector listens for those recordings and records them as a 
//   `Metric`, which is a histogram of all recorded values. A `Metric` is 
//   always assigned to the thread from where it originated from.
// 
// - It also provides a method to query collected metrics, via the
//   a class that allows querying its contents via a fluent API.

import { Bus } from '../bus/index.js'
import { ThreadMetricsGroup } from './collection/index.js'
import { metric } from './emitter/index.js'

class MetricsCollector {
  constructor() {
    this.on = true  
    this.bus = Bus()  
    this.threads = new ThreadMetricsGroup()
  }
  
  start(threads, cb) {
    this.#trackMetricsForThread(process)
    Object.values(threads).forEach(this.#trackMetricsForThread.bind(this))

    this.bus.start()
    this.bus.listen(threads, metric => {
      return this.on ? (() => {
        this.#record(metric)
        cb(this.threads.metrics.bind(this.threads)) 
      })() : null
    })
  }
  
  stop() {    
    this.on = false
    this.bus.stop()
  }
  
  result() {
    return this.threads.metrics()
  }
  
  #trackMetricsForThread({ pid }) {
    this.threads.trackMetricsForThread({ pid })
  }
  
  #record({ pid, name, value }) {
    const metrics = this.threads.getMetricsOfThread({ pid })
    const metric = metrics.getMetric({ name })

    return metric 
      ? metric.record(value)
      : metrics.addMetric({ pid, name, value })
  }
}

export { MetricsCollector, metric }

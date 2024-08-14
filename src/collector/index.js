import { Bus } from '../bus/index.js'
import { MetricsGroup } from './metrics/index.js'

class Collector {
  constructor() {
    this.on = true  
    this.bus = Bus()  
    this.metricsGroup = new MetricsGroup()
  }
  
  start(threads, cb) {
    this.#createTrackedMetricsForThread(process)
    Object.values(threads)
      .forEach(this.#createTrackedMetricsForThread.bind(this))

    this.bus.start()
    this.bus.listen(threads, metric => {
      return this.on ? (() => {
        this.#record(metric)
        cb(this.metricsGroup.log.bind(this.metricsGroup)) 
      })() : null
    })
  }
  
  stop() {    
    this.on = false
    this.bus.stop()
  }
  
  result() {
    return this.metricsGroup
  }
  
  #createTrackedMetricsForThread({ pid }) {
    this.metricsGroup.trackMetricsForThread({ pid })
  }
  
  #record({ pid, name, value }) {
    const metrics = this.metricsGroup.getMetricsOfThread({ pid })
    const metric = metrics.getMetric({ name })

    return metric 
      ? metric.record(value)
      : metrics.addMetric({ pid, name, value })
  }
}

export default Collector

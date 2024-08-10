import { Bus } from '../bus/index.js'
import { ProcessStat } from './process-stat/index.js'

class Collector {
  constructor() {
    this.on = true    
    
    this.stats = {
      main: {},
      threads: {},
      get thread() {
        return this.threads[Object.keys(this.threads)[0]] || {}
      }
    }

    this.bus = Bus()
  }
  
  start(threads, cb) {
    this.bus.start()
    this.bus.listen(threads, stat => {
      return this.on ? (() => {
        this.#record(stat)
        cb(this.stats) 
      })() : null
    })
  }
  
  stop() {
    const json = JSON.stringify(this.stats)
    
    this.on = false
    this.bus.stop()
    
    return json
  }
  
  #record({ pid, name, value }) {
    if (pid === process.pid)
      return this.#recordMain({ name, value })

    if (!this.stats.threads[pid])
      return this.stats.threads[pid] = new ProcessStat({ name, value })
    
    if (!this.stats.threads[pid][name])
      return this.stats.threads[pid].createTimeseriesHistogram({ name, value })

    this.stats.threads[pid][name].record(value)
  }
  
  #recordMain({ name, value }) {
    if (!Object.keys(this.stats.main).length)
      this.stats.main = new ProcessStat({ name, value })

    if (!this.stats.main[name])
      return this.stats.main.createTimeseriesHistogram({ name, value })

    return this.stats.main[name].record(value)
  }
}

export default Collector

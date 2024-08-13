import { Bus } from '../bus/index.js'
import { Stats, HistogramsList } from './stats/index.js'

class Collector {
  constructor() {
    this.on = true  
    this.bus = Bus()  
    this.stats = new Stats()
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
    this.on = false
    this.bus.stop()
  }
  
  #record({ pid, name, value }) {
    if (!this.stats[pid])
      return this.stats[pid] = new HistogramsList({ 
        pid, name, value 
      })
    
    if (!this.stats[pid][name])
      return this.stats[pid].createTimeseriesHistogram({ 
        name, value 
      })

    this.stats[pid][name].record(value)
  }
}

export default Collector

import { Bus } from '../bus/index.js'
import { ProcessStat } from './process-stat/index.js'

class Collector {
  constructor() {
    this.on = true    
    this.stats = {}
    
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
    // @REVIEW, 
    // - `stats` is not a good name for this, 
    //   too long to carry around in userland when building views

    if (!this.stats[pid])
      return this.stats[pid] = new ProcessStat({ name, value })
    
    if (!this.stats[pid][name])
      return this.stats[pid].createTimeseriesHistogram({ name, value })

    this.stats[pid][name].record(value)
  }
}

export default Collector

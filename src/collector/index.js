import { Bus } from '../bus/index.js'
import { Stats, HistogramsList } from './stats/index.js'

class Collector {
  constructor() {
    this.on = true  
    this.bus = Bus()  
    this.stats = new Stats()
  }
  
  start(threads, cb) {
    this.#createStat(process)
    Object.values(threads).forEach(this.#createStat.bind(this))

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
  
  #createStat({ pid }) {
    this.stats[pid] = new HistogramsList({ pid: pid.toString() })
  }
  
  #record({ pid, name, value }) {    
    if (!this.stats[pid][name])
      return this.stats[pid].createTimeseriesHistogram({ 
        name, value 
      })

    this.stats[pid][name].record(value)
  }
}

export default Collector

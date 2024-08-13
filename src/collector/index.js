import { Bus } from '../bus/index.js'
import HistogramsList from './histograms-list/index.js'

const round = num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'n/a'
const pid = process.pid.toString()

class Collector {
  constructor() {
    this.on = true  
    this.bus = Bus()  
    this.histogramsLists = {}
  }
  
  start(threads, cb) {
    this.bus.start()
    this.bus.listen(threads, stat => {
      return this.on ? (() => {
        this.#record(stat)
        cb(Object.values(this.histogramsLists)) 
      })() : null
    })
  }
  
  stop() {    
    this.on = false
    this.bus.stop()
  }
  
  #record({ pid, name, value }) {
    if (!this.histogramsLists[pid])
      return this.histogramsLists[pid] = new HistogramsList({ 
        pid, name, value 
      })
    
    if (!this.histogramsLists[pid][name])
      return this.histogramsLists[pid].createTimeseriesHistogram({ 
        name, value 
      })

    this.histogramsLists[pid][name].record(value)
  }
}

export default Collector

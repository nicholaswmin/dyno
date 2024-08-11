import { Bus } from '../bus/index.js'
import { ProcessStat } from './process-stat/index.js'

const round = num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'n/a'
const nsToMs = num => round(num / 1000000)
const pid = process.pid.toString()

class Collector {
  constructor() {
    this.on = true  
    this.bus = Bus()  
    
    this.stats = {
      threads: {},

      get main() {
        const stats = Object.keys(this.threads[pid])
          .reduce((acc, key) => ({
            ...acc,
            [key]: this.threads[pid][key]?.count
          }), {})
        
        return {
          ...stats,
          backlog: stats.sent - stats.done,
          uptime: stats.uptime
        }
      },

      get tasks() {
        return Object.keys(this.threads)
          .filter(_pid => _pid !== pid)
          .reduce((acc, pid) => ([ 
            ...acc, 
            Object.keys(this.threads[pid])
              .reduce((acc, task) => ({
                ...acc, 
                thread: pid, 
                // @NOTE declare tasks that need `ns` -> `ms` conversion
                // @REVIEW bad hack, the emitters must always emit in `ms`
                [task]: ['eloop'].includes(task) 
                  ? nsToMs(this.threads[pid][task].mean)
                  : round(this.threads[pid][task].mean)
              }), {})
          ]), [])
      }
    }
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
    if (!this.stats.threads[pid])
      return this.stats.threads[pid] = new ProcessStat({ 
        name, value 
      })
    
    if (!this.stats.threads[pid][name])
      return this.stats.threads[pid].createTimeseriesHistogram({ 
        name, value 
      })

    this.stats.threads[pid][name].record(value)
  }
}

export default Collector

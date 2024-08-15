// helpers to avoid convoluted user code, 
// makes it easier to track measures using: `metric().record()`

import { monitorEventLoopDelay } from 'node:perf_hooks'

const toRoundedMillis = nanos => Math.ceil(nanos / 1000000)

class LoopDelayObserver {
  constructor (cb, interval = 250) {
    this.cb = cb
    this.timer = null
    this.interval = interval
    this.histogram = monitorEventLoopDelay()
  }
  
  enable()  { this.histogram.enable () }
  disable() { this.histogram.disable() }

  observe() {
    this.histogram.enable()
    this.timer = setInterval(() => 
      this.cb(toRoundedMillis(this.histogram.mean || 1)),
      this.interval
    )
  }

  disconnect() {
    clearInterval(this.timer)
    this.histogram.disable()
  }
}

const mapToEntries = cb => {
  return list => list.getEntries()
    .map(entry => ({
      ...entry.toJSON(), 
      name: entry.name.replace('bound ', '').trim(),
      duration: Math.ceil(entry.duration)
    })).forEach(entry => cb(entry))
}

export { LoopDelayObserver, mapToEntries }

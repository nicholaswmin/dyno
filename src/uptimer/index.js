import { metric } from '../metrics/index.js'

class Uptimer {
  constructor() {
    this.on = true
    this.timer = null
  }

  start() {
    this.#tick()
    this.timer = setInterval(this.#tick.bind(this), 1000)
  }
  
  stop() {
    clearInterval(this.timer)
    metric().stop()
  }
  
  #tick() {
    return this.on ? metric('uptime').record(1) : false
  }
}

export default Uptimer

import histogram from '../histogram/index.js'

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
    histogram().stop()
  }
  
  #tick() {
    return this.on ? histogram('uptime').record(1) : false
  }
}

export default Uptimer

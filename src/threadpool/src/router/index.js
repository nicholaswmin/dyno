import { EventEmitter } from 'node:events'
  
class HerokuRouter extends EventEmitter {
  #routings = {}
  #routeCounter = 0

  constructor() {
    super()
    this.threads = []
  }
  
  route() {
    const requestId = Math.random().toString().slice(3)
    const next = this.threads[++this.#routeCounter % this.threads.length]

    this.#routings[requestId] = Promise.withResolvers()

    next.emit('task:ping', { requestId, start: performance.now() })
    
    return this.#routings[requestId].promise
  }
  
  setup(threads) {
    if (this.threads.length)
      throw new Error('cammpt setup twice. already setup')
    
    this.threads = threads
    this.timer = setInterval(() => {
      console.log(this.#routeCounter, 'per second', 'backlog', Object.keys(this.#routings).length)
      this.#routeCounter = 1
    }, 1000)

    this.threads.forEach(thread => {
      thread
        .removeAllListeners('task:pong')
        .on('task:pong', ({ requestId, start, pid }) => {
          const service = performance.now() - start
          const count = this.#routeCounter

          this.#routings[requestId].resolve({ 
            pid, 
            requestId, 
            service, 
            count,
            backlog: Object.keys(this.#routings).length
          })
          delete this.#routings[requestId]
        })
    })
  }
}

export { HerokuRouter }

// continously emits 'ping'
import { primary } from '../../index.js'

setInterval(() => primary.emit('ping'), 100) // set >= 100ms

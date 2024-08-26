// continously emits 'ping'
import { primary } from '../../index.js'

setInterval(() => primary.emit('ping'), 150) // set < 100ms

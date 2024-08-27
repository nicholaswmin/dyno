// continously emits 'ping'
import { primary } from '../../index.js'

setInterval(() => primary.emit('ping'), 50)

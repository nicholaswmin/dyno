// - sends back its ENV variables when asked to 
import { primary } from '../../index.js'

primary.on('ping', () => setImmediate(() => primary.emit('pong', process.env)))

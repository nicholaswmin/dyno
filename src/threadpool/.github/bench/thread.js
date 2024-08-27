import { primary } from '../../index.js'

primary.on('ping', () => setImmediate(() => primary.emit('pong'), 10))

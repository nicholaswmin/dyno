// sends `pong` in response to a `ping`
import { primary } from '../../index.js'

primary.on('ping', () => 
  queueMicrotask(() => primary.emit('pong', { id: process.pid })))

process.on('message', msg => msg === 'exit' ? process.exit(0) : null)

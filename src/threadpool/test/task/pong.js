import { primary } from '../../index.js'

primary.on('ping', () => {
  setImmediate(() => primary.emit('pong'))
})

process.on('message', msg => msg === 'exit' ? process.exit(0) : null)

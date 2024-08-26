import { primary } from '../../../index.js'

primary.on('ping', () => {
  console.log('ping 🏓')

  setTimeout(() => primary.emit('pong'), 50)
})

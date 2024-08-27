import { display, type, data, size, path } from './config.js'
import { Threadpool } from '../../index.js'

console.log('starting up...')

// Main Ping/Pong code

const pool = new Threadpool(path, size)
await pool.start()

let pongs = 0, payload = 'a'.repeat(data)

pool.on('pong', () => setImmediate(() => {
  ++pongs, pool[type.trim()]('ping', { payload })
})).emit('ping')

// End Ping/Pong code

setInterval(() => {
  display({ type, size, data, pongs })
  pongs = 0
}, 1 * 1000)

process.once('SIGINT', () => {
  pool.stop()
  console.log('\n', 'Pool stopped. bye 👋', '\n')
  setTimeout(() => process.exit(0))
})

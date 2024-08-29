import { loadavg } from 'node:os'
import { data, size, path } from './params.js'
import { Threadpool } from '../../index.js'

// Main code begin

console.log('starting up...')

const pool = new Threadpool(path, size)
await pool.start()

let ticks = 1, pings = 0, pongs = 0, payload = 'a'.repeat(data * 1000)

pool.on('pong', data => setImmediate(async () => {
  return ++pongs % pool.size === 0 
    ? pool.broadcast('ping', { 
      payload, pings: ++pings 
    })
    : null
})).broadcast('ping', { payload })


// End of main code

setInterval(() => {
  console.clear()
  console.table([{
    'ticks': ++ticks,
    'pings/sec.': Math.round(pings / ticks),
    'pongs/sec.': Math.round(pongs / ticks),
    'ping data (mb/sec.)': Math.round(Math.round(pings / ticks) * data) / 1000, 
    'pong data (mb/sec.)': Math.round(Math.round(pongs / ticks) * data) / 1000
  }])
  console.log('\n', 'threads:', size, '|', 'payload (KB):', data, '|', 
    'Load avg. (1 min):', Math.round(loadavg()[0]), '|',
    'Memory usage (mb):', Math.round(process.memoryUsage().heapUsed / 1000000)
  )
}, 1000)

process.on('SIGINT', () => { pool.stop(), process.exit(0) })
process.on('SIGTERM', () => { pool.stop(), process.exit(0) })

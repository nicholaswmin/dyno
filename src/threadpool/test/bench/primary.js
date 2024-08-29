import { loadavg } from 'node:os'
import { data, size, path } from './params.js'
import { Threadpool } from '../../index.js'

// Bechmark code

console.log('starting up...')

let pool = new Threadpool(path, size), 
    ticks = 0,
    pings = 0, 
    pongs = 0, 
    payload = 'a'.repeat(data * 1000)

await pool.start()

pool.on('pong', data => setImmediate(() => {
  return ++pongs % pool.size === 0 
    ? pool.broadcast('ping', { payload, pings: ++pings  })
    : false
}))

// Stats

setInterval(() => {
  if (ticks === 0)
    pool.broadcast('ping', { payload })
  
  console.clear()

  console.table([{
    'ticks': ++ticks,
    'pings/sec': Math.round(pings / ticks),
    'pongs/sec': Math.round(pongs / ticks),
    'ping (mb/sec)': Math.round(pings / ticks * data / 1000), 
    'pong (mb/sec)': Math.round(pongs / ticks * data / 1000)
  }])

  console.log('\n', 
    'threads:', size, '|', 'ticks:', ++ticks, '|', 'payload (KB):', data, '|', 
    'Load avg. (1 min):', Math.round(loadavg()[0]), '|',
    'Memory usage (mb):', Math.round(process.memoryUsage().heapUsed / 1000000)
  )
}, 1000)

// Graceful exit

;['SIGINT','SIGTERM'].forEach(e => 
  process.on(e, () => pool.stop().then(process.exit.bind(process, 0))))

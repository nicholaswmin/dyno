import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { parseArgs, styleText } from 'node:util'
import { Threadpool } from '../../index.js'

const { values: { type, size, kb }  } = parseArgs({ options: { 
  type: { type: 'string', default: 'broadcast' },
  size: { type: 'string', default: availableParallelism().toString() },
  kb:   { type: 'string', default: '1' }
}})

if (!['broadcast', 'emit'].includes(type.trim()))
  console.log(styleText('red', '--type can be: "broadcast" or "emit"'), '\n'),
  process.exit(0)


// Ping/Pong
const pool = new Threadpool(join(import.meta.dirname, 'thread.js'), +size)
await pool.start()

console.log('starting up...')

let pongs = 0, payload = 'a'.repeat(+kb * 1000)

pool.on('pong', () => setImmediate(() => {
  ++pongs, pool[type.trim()]('ping', { payload })
})).emit('ping')

setInterval(() => {
  console.clear()
  console.log('Ping/Pong Benchmark')
  console.table([{ 
    'type': `${type}()`,
    'threads': pool.size, 
    'payload (KB)': +kb,
    'pings per sec.': type === 'emit' ? pongs : Math.round(pongs / pool.size),
    'pongs per sec.:': pongs 
  }])

  pongs = 0
}, 1 * 1000)

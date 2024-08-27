import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { parseArgs, styleText } from 'node:util'

let display = ({ type, size, data, pongs }) => {
  console.clear()
  console.table([{ 
    'type': `${type}`,
    'threads': size, 
    'payload (bytes)': data,
    'pings/second': type === 'emit' ? pongs : Math.round(pongs / size),
    'pongs/second': pongs 
  }])
  console.log('\n', 'Elapsed:', Math.ceil(process.uptime()), 'seconds')
}

let path = join(import.meta.dirname, 'thread.js') 

let { values: { type, size, data }  } = parseArgs({ options: { 
  type: { type: 'string', default: 'broadcast' },
  size: { type: 'string', default: availableParallelism().toString() },
  data: { type: 'string', default: '1000' }
}})

if (!['broadcast', 'emit'].includes(type.trim()))
  console.log(styleText('red', '--type can be: "broadcast" or "emit"'), '\n'),
  process.exit(0)

size = +size
data = +data

export { display, path, type, size, data }

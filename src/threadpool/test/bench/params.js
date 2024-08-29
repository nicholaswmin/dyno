import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { parseArgs, styleText } from 'node:util'

let path = join(import.meta.dirname, 'thread.js') 
let { values: { type, size, data }  } = parseArgs({ options: { 
  size: { type: 'string', default: availableParallelism().toString() },
  data: { type: 'string', default: '1' }
}})

size = +size, data = +data

export { path, size, data }

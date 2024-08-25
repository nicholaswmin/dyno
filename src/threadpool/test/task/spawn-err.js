// throws synchronous exception on-load
// on every other thread

import { primary } from '../../index.js'

if (+process.env.index % 2 === 0)
  throw new Error('Simulated Spawn Error')

// throws synchronous exception on-load

import { primary } from '../../index.js'

if (+process.env.index === 0)
  throw new Error('Simulated Spawn Error')

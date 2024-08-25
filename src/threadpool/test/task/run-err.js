// spawns OK but exits: 1 during runtime
import { primary } from '../../index.js'

if (+process.env.index === 0)
  setTimeout(() => {
    throw new Error('Simulated Runtime Error')
  }, 500)

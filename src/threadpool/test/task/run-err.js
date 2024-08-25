// spawns OK but exits: 1 during runtime
import { primary } from '../../index.js'

if (+process.env.index === 0)
  setTimeout(() => {
    throw new Error('Simulated Error for error-handling tests.')
  }, 500)

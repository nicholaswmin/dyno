// exits: 0 after cleanups
import { primary } from '../../index.js'

process.once('SIGTERM', () => {
  // suppose some cleanups are done here

  setTimeout(() => {
    process.exit(0)
  }, 5)
})

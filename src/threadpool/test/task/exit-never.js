// takes too long to exit
import { primary } from '../../index.js'

process.once('SIGTERM', () => {
  setTimeout(() => process.exit(0), 30 * 1000)
})

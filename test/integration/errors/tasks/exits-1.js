// 1st exits with code: 1
import { task } from '../../../../index.js'

task(async function task() {
  if (+process.env.index === 1)
    process.exit(1)
})

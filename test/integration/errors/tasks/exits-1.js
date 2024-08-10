// 1st exits with code: 1
import { run } from '../../../../index.js'

run(async function task() {
  if (+process.env.index === 1)
    process.exit(1)
})

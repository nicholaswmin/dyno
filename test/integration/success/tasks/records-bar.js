// records an arbitrary value for i.e "`foo`" 

import { run } from '../../../../index.js'
import histogram from '../../../../src/histogram/index.js'

let count = 0
run(async function task() {
  histogram('bar').record(++count)
})

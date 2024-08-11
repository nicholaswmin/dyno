// records an arbitrary value for i.e "`foo`" 

import { task } from '../../../../index.js'
import histogram from '../../../../src/histogram/index.js'

let count = 0
task(async function task() {
  histogram('bar').record(++count)
})

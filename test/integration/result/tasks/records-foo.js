// records an arbitrary value for i.e "`foo`" 10 times, from 1 - 10.
// we expect it gets recorded as a histogram with min 1, mean 5.5, max 10 etc...

import { run } from '../../../../index.js'
import histogram from '../../../../src/histogram/index.js'

let counter = 0
run(async function task() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  await sleep(10)
})

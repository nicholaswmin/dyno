import { join } from 'node:path'

// general

const mock = (testContext, fn) => {
  fn = testContext.mock.fn(fn)
  fn.results = () => fn.mock.calls.map(call => call.result)
  fn.reset = () => { fn.mock.resetCalls() }
  
  Object.defineProperty(fn, 'results', {
    get() {
      return fn.mock.calls.map(call => call.result)
    }
  })

  return fn
}

const task = filename => join(import.meta.dirname, `../task/${filename}`)

// array filters

const connected = child => child.connected

const alive = child => [
  child.exitCode, 
  child.signalCode
].every(value => value == null)

const dead = child => child.exitCode !== null || child.signalCode !== null

const exitNonZero = child => !!child.exitCode && child.exitCode > 0

const exitZero = child => child.exitCode === 0

const sigkilled = child => child.signalCode === 'SIGKILL'

export { 
  // general
  mock, task,
  // array filters
  connected, alive, dead, exitZero, exitNonZero, sigkilled }

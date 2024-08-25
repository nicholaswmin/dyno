import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

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

const execCommand = async (command, timeout = 1000) => {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), timeout)
  
  let out = null
  
  try {
    out = await promisify(execFile)(
      'node', ['--no-warnings', ...command.split(' ').slice(1)], 
      { 
        cwd: join(import.meta.dirname, '../../'), 
        stdio: 'pipe', 
        encoding: 'utf8',
        signal: ctrl.signal
      }
    )
  } catch (err) {
    if (err.code !== 'ABORT_ERR')
      throw err
    
    out = err
  }
  
  return out
}

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
  mock, task, execCommand,
  // array filters
  connected, alive, dead, exitZero, exitNonZero, sigkilled }

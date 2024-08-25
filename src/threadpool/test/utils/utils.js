import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// general

const task = filename => join(import.meta.dirname, `../task/${filename}`)

const execRootCommand = async (command, cutoffMs = 1000) => {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), cutoffMs)
  
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
  task, execRootCommand,
  // array filters
  connected, alive, dead, exitZero, exitNonZero, sigkilled }

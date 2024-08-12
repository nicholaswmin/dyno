import { setTimeout } from 'node:timers/promises'
import readline from 'node:readline/promises'
import util from 'node:util'

class Writeline {
  constructor() {
    this.asyncFn = null
    this.asyncFnResult = null 

    this.lastInterface = null

    this.lastStdout = '' 
    this.lastStderr = ''

    this.stdoutWrite = {
      originalFn: process.stdout.write,
      boundFn: process.stdout.write.bind(process.stdout)
    }
    
    this.stderrWrite = {
      originalFn: process.stderr.write,
      boundFn: process.stderr.write.bind(process.stderr)
    }
    
    this.createInterface = {
      originalFn: readline.createInterface,
      boundFn: readline.createInterface.bind(readline)
    }

    process.stdout.write = (chunk, enc, cb) => {
      this.lastStdout = chunk.toString()
      
      return this.stdoutWrite.boundFn(chunk, enc, cb)
    }

    process.stderr.write = (chunk, enc, cb) => {
      this.lastStderr = chunk.toString()

      return this.stderrWrite.boundFn(chunk, enc, cb)
    }

    readline.createInterface = (...args) => {
      this.lastInterface = this.createInterface.boundFn(...args)

      return this.lastInterface
    }
  }

  reset() {
    if (this.lastInterface) {
      this.lastInterface.clearLine(0)
      this.lastInterface.close()
    }
    
    this.asyncFn = null
    this.asyncFnResult = null
    
    this.lastInterface = null

    this.lastStdout = '' 
    this.lastStderr = ''
    
    return setTimeout(0)
  }
  
  async restore() {
    await this.reset()

    process.stdout.write = this.stdoutWrite.originalFn
    process.stderr.write = this.stderrWrite.originalFn
    readline.createInterface = this.createInterface.originalFn
  }
  
  on(asyncFn) {
    this.asyncFn = asyncFn
    
    return this
  }
  
  type(str = '') {
    setTimeout(0).then(() => {
      if (!this.lastInterface)
        throw new Error('readline.createInterface() was not called')

      this.lastInterface.write(str.toString())
    })
    
    return this
  }
  
  pressEnter() {
    setTimeout(0).then(() => {
      this.lastInterface.write('\n')
      this.lastInterface.clearLine(0)
    })
    
    return this
  }
  
  done() {
    const promise = new Promise(resolve => {
      setTimeout(0).then(() => {
        setTimeout(0).then(() => resolve({
          stdout: util.stripVTControlCharacters(this.lastStdout),
          stderr: util.stripVTControlCharacters(this.lastStderr)
        }))
      })
    })
    
    return Promise.race([
      promise.then(value => ({ ...value, resolved: false })),
      this.asyncFn.then(value => ({ value, resolved: true }))
    ]).finally(this.reset.bind(this))
  }
}

export default Writeline

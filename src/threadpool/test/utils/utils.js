const connected = child => child.connected

const alive = child => [
  child.exitCode, 
  child.signalCode
].every(value => value == null)

const dead = child => child.exitCode !== null || child.signalCode !== null

const exitNonZero = child => !!child.exitCode && child.exitCode > 0

const exitZero = child => child.exitCode === 0

const sigkilled = child => child.signalCode === 'SIGKILL'

export { connected, alive, dead, exitZero, exitNonZero, sigkilled }

import cp from 'node:child_process'

const createMissingSpawnedError = () => new Error(
  'Missing "spawned" event. Did you import primary bus?'
)

const kill = child => {
  if (child.exitCode === null && child.signalCode === null)
    child.kill()
  
  return child
}

const fork = (path, env, { spawnTimeout }) => {
  return new Promise((resolve, reject) => {
    let child, stderr = '', error = null

    const timer = setTimeout(() => {
      offAll(child)
      kill(child)
      
      return reject(createMissingSpawnedError())
    }, spawnTimeout) 

    const onstderr = data => stderr += data.toString()
    const onmessage = msg => msg === 'spawned' ? resolve(offAll(child)) : null
    const onerror = err => (child.kill(), error = err)
    const onclose = (code, signal) => {
      error = error === null && code === 0 && signal === null 
        ? createMissingSpawnedError() 
        : error
      
      if (child.connected) 
        kill(child)
      
      offAll(child)

      return error || stderr ? reject(new Error(stderr || error)) : null
    }
    
    const offAll = child => {
      clearTimeout(timer)

      child
        .off('close', onclose)
        .off('error', onerror)
        .off('message', onmessage)
      
      child.stderr.off('data', onstderr)

      return child
    }

    child = cp.fork(path, {
      stdio: ['ipc', 'pipe', 'pipe'],
      env: { ...env }
    })
    
    child
      .on('message', onmessage)
      .once('close', onclose)
      .once('error', onerror)
    
    child.stderr.on('data', onstderr)
  })
}

export { fork }

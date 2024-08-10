import child_process from 'node:child_process'

const forkProcess = (task, { parameters, index }) => 
  new Promise((resolve, reject) => {
    const onSpawn = function ()    { this.off('error', onError); resolve(this) }
    const onError = function (err) { this.off('spawn', onSpawn); reject(err)   }

    child_process.fork(task, {
      env: { 
        ...process.env, 
        parameters: JSON.stringify(parameters),
        index: index
      }
    }).once('spawn', onSpawn).once('error', onError)
})

const fork = async (task, { parameters, concurrency = 4 }) => {
  const threads = await Promise.all(
    Array.from({ length: concurrency }, 
        (_, index) => forkProcess(task, { parameters, index })))
      .then(threads => threads.reduce((acc, thread) => ({ 
        ...acc, [thread.pid]: thread 
      }), {}))
  
  return Object.freeze(threads)
}

const watch = (threads, { signal }) => {
  const alive = Object.values(threads).filter(thread => thread.connected)  

  return alive.length 
    ? Promise.all(alive.map(thread => new Promise((resolve, reject) => {
        const _handleThreadExit = code => !code 
          ? resolve() 
          : reject(new Error(`A thread exited with code: ${code}.`))
      
        thread.once('exit', _handleThreadExit).once('error', reject)
        
        signal.addEventListener('abort', () => {
          thread.off('exit', _handleThreadExit)

          resolve()
        })
      })))
    : true
}

const disconnect = async threads => {
  const timeout = 500
  const alive = Object.values(threads).filter(thread => thread.connected)  
  
  const deaths = alive.map(thread => new Promise((resolve, reject) => {
    const onExit = function () {  this.off('error', onError); resolve(this) }
    const onError = function (err) {  this.off('exit', onExit); reject(err) }

    thread.once('exit', onExit)
    thread.once('error', onError)
  }))
  
  let sigkilled = setTimeout(() => {
    alive.forEach(thread => thread.kill('SIGKILL'))
    sigkilled = true
  }, timeout)
  
  alive.forEach(thread => thread.connected 
    ? thread.send({ name: 'process:disconnect' }) 
    : null)
  
  return Promise.all(deaths)
    .then(() => sigkilled === true ? (() => {
      throw new Error('process:disconnect timeout. Exited with:SIGKILL')
    })() : clearTimeout(sigkilled))
}

export default { fork, disconnect, watch }

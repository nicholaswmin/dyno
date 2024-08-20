// doesn't `process.exit(0)` when asked to

process.on('message', message => {  
  setImmediate(() => process.send('hello'))
})

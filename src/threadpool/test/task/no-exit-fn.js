// doesn't `process.exit(0)` when asked to
// says hi instead

process.on('message', message => {  
  setImmediate(() => process.send('hi'))
})

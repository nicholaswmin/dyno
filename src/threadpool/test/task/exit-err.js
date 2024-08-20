// exits: 1 during exit cleanups
process.on('message', message => {  
  message === 'exit' ? setImmediate(() => {
    process.exit(+process.env.index === 0 ? 1 : 0)
  }) : 0
})

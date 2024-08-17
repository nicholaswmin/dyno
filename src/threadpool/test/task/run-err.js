// spawns OK but exits: 1 during runtime

if (+process.env.CHILD_INDEX === 0)
  setImmediate(() => process.exit(1))

process.on('message', message => {
  message === 'exit' ? setTimeout(() => process.exit(0), 10) : 0
})

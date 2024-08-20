// spawns OK but exits: 1 during runtime

if (+process.env.index === 0)
  setTimeout(() => process.exit(1), 50)

process.on('message', message => {
  message === 'exit' ? setImmediate(() => process.exit(0)) : 0
})

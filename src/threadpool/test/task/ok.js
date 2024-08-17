// runs ok, exits when asked to

process.on('message', message => {  
  message === 'env' ? process.connected ? process.send({
    env: process.env,
    childIndex: +process.env.CHILD_INDEX,
    parameters: JSON.parse(process.env.parameters || null)
  }) : 0 : 0
  
  message === 'exit' ? setTimeout(() => process.exit(0)) : 0
})

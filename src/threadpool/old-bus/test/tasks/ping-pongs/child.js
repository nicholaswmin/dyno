import { ChildBus } from '../../../index.js'

const bus = new ChildBus()

bus.on('ping', () => {
  console.log(` children[${process.env.index}] got: PING, sending: PONG`)
  
  bus.emit('pong')
})

process.on('disconnect', async () => {
  await bus.stop()  
  console.log('stopping child bus')
  console.log('child', 'disconnecting')
  process.disconnect()
})

import { join } from 'node:path'
import { fork } from 'node:child_process'
import { PrimaryBus } from '../../../index.js'

const bus = new PrimaryBus()

const children  = [
  fork(join(import.meta.dirname, 'child.js'), { env: { index: 1 }}),
  fork(join(import.meta.dirname, 'child.js'), { env: { index: 2 }})
]

bus.start(children)

bus.emit('PING', { foo: 'bar' })

let pings = 0
let maxPingPongs = 5

process.on('beforeExit', () => console.log('primary exit.'))

bus.on('pong', async () => {
  console.log(`  primary[0] got: PONG, sending: PING`)

  while (++pings < maxPingPongs)
    return bus.emit('ping')

  await bus.stop()

  console.log('\n','stopping primary bus ...')
  
  children.forEach(child => child.kill())

  console.log('\n','stopping primary bus ...')
})

bus.emit('pong')

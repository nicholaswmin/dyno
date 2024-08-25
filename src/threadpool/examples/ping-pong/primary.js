import { join } from 'node:path'
import { Threadpool } from '../../index.js'

const path = join(import.meta.dirname, 'thread.js')
const pool = await (new Threadpool(path, 4)).start()

for (const thread of pool.threads)
  thread.on('pong', () => {
    console.log('🏓 pong')

    thread.emit('ping')
  })

pool.threads.at(0).emit('ping')

setTimeout(() => pool.stop(), 3 * 1000)

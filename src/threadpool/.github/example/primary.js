// Ping/pong between primary and the threads  
// Run: `node primary.js`

import { join } from 'node:path'
import { Threadpool } from '../../index.js'

const pool = new Threadpool(join(import.meta.dirname, 'thread.js'), 4)

for (const thread of await pool.start())
  thread.on('pong', () => {
    console.log('🏓 pong')

    thread.emit('ping')
  })

pool.threads.at(0).emit('ping')

setTimeout(() => pool.stop(), 1 * 1000)

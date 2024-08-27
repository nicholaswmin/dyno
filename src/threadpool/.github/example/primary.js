import { join } from 'node:path'
import { Threadpool } from '../../index.js'

const pool = new Threadpool(join(import.meta.dirname, 'thread.js'), 4)

await pool.start()

pool
  .on('pong', () => {
    console.log('🏓 pong')
    pool.emit('ping')
  })
  .emit('ping')

setTimeout(() => pool.stop(), 2 * 1000)

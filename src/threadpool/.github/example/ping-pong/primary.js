import { join } from 'node:path'
import { Threadpool } from '../../../index.js'

const path = join(import.meta.dirname, 'thread.js')
const pool = new Threadpool(path, 4)

await pool.start()

pool.on('pong', () => {
  console.log('🏓 pong')
  pool.emit('ping')
})

pool.emit('ping')

setTimeout(() => pool.stop(), 1 * 1000)

import test from 'node:test'
import { task } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('thread env. vars', async t => {
  const pool = new Threadpool(task('env.js'), 2, { FOO: 'BAR', BAZ: 'QUUX' })
  const envs = await pool.start()
    .then(() => new Promise(resolve => pool.on('pong', resolve).emit('ping')))
    .finally(pool.stop.bind(pool))

  

  await t.test('passes env. vars', async t => {
    t.assert.ok(Object.hasOwn(envs, 'FOO'), 'missing env. variable "FOO"')
    t.assert.strictEqual(envs.FOO, 'BAR')
    
    t.assert.ok(Object.hasOwn(envs, 'BAZ'), 'missing env. variable "BAZ"')
    t.assert.strictEqual(envs.BAZ, 'QUUX')
  })

  
  
  await t.test('passes a spawn index', t => {
    t.assert.ok(Object.hasOwn(envs, 'index'), 'missing env. variable "index"')
    t.assert.strictEqual(typeof +envs.index, 'number')
  })
})

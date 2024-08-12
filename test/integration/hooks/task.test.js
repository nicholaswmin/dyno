import fs from 'node:fs'
import test from 'node:test'
import { join } from 'node:path'
import { dyno } from '../../../index.js'

test('#dyno() task before/after hooks', async t => {
  let jsons = []

  t.before(async () => {
    const paths = [ 'before.json', 'task.json', 'after.json' ]
      .map(p => join(import.meta.dirname, `./tasks/temp/${p}`))

    paths.forEach(path => fs.rmSync(path, { force: true }))
    
    await dyno(join(import.meta.dirname, 'tasks/runs-hooks.js'), {
      parameters: { cyclesPerSecond: 5, threads: 2, durationMs: 200 }
    })
    
    jsons = paths.map(path => fs.readFileSync(path, 'utf8'))
      .map(file => JSON.parse(file))
      .sort((a, b) => a.created - b.created)
  })
  
  t.todo('single-file, local hooks', async t => {
    // @REVIEW
    // hard to test, single-file benchmarks means the main-file
    // is run as a thread
  })
  
  await t.test('all 3 hooks run', async t => {
    t.assert.strictEqual(jsons.length, 3)
  })

  await t.test('jsons created recently', async t => {
    const since = Date.now() - jsons.at(0).created < 1000
    t.assert.ok(since < 1000, `jsons were created > 1000ms ago, is ${since} ms`)
  })

  await t.test('#before hook', async t => {
    const i = jsons.findIndex(json => json.hook === 'before')
    
    await t.test('runs', async t => {
      t.assert.ok(jsons !== 1, 'no { hook: "before" } JSON found')
    })

    await t.test('runs first', async t => {
      t.assert.strictEqual(i, 0)
    })
  })
  
  await t.test('#task', async t => {
    const i = jsons.findIndex(json => json.hook === 'task')
    
    await t.test('runs', async t => {
      t.assert.ok(jsons !== 1, 'no { hook: "task" } JSON found')
    })

    await t.test('runs second', async t => {
      t.assert.strictEqual(i, 1)
    })
  })
  
  await t.test('#after hook', async t => {
    const i = jsons.findIndex(json => json.hook === 'after')
    
    await t.test('runs', async t => {
      t.assert.ok(jsons !== 1, 'no { hook: "after" } JSON found')
    })

    await t.test('runs last', async t => {
      t.assert.strictEqual(i, 2)
    })
  })
})

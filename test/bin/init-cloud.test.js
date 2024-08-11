import test from 'node:test'
import path from 'node:path'
import util from 'node:util'
import child_process from 'node:child_process'
import fs, { readFile } from 'node:fs/promises'
import { fileExists, onStdout } from './utils/utils.js'

const tempdir = path.join(import.meta.dirname, './temp')
const exec = util.promisify(child_process.exec)

test('$ npx init-cloud: creates a Heroku-deployable benchmark', async t => {    
  t.todo('creates a benchmark package', async t => {
 
  })
})

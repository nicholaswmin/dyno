import path from 'node:path'
import * as fs from 'node:fs/promises'

const dirname = import.meta.dirname

const replaceTokensInFile = async ({ 
  srcfolder, 
  filepath, 
  entrypath,
  fragments 
}) => {    
  for (const fragment of fragments) {
    const srcpath = path.join(dirname, `../${srcfolder}/${fragment.target}`)
    const contents = await fs.readFile(srcpath, 'utf8')
    const processed = contents
      .replaceAll('{{entrypath}}', entrypath)
      .replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g,'')

    const existing = await fs.readFile(filepath, 'utf8')

    const n1 = existing.indexOf(fragment.startToken)
    const n2 = existing.indexOf(fragment.endToken, n1)
    const rm = existing.slice(0, n1) + existing.slice(n2)

    await fs.writeFile(
      filepath, 
      `${rm.slice(0, n1)}${fragment.startToken}\n${processed}${rm.slice(n1)}`
    )
  }
}

const createExample = async ({ 
  srcfolder, 
  targetfolder, 
  entrypath, 
  fragments 
}) => {
  try {
    await fs.rm(targetfolder, { recursive: true, force: true })
    await fs.mkdir(targetfolder)
    
    console.log('created:', targetfolder)

    for (const fragment of fragments) {
      const srcpath = path.join(dirname, `../${srcfolder}/${fragment.target}`)
      const contents = await fs.readFile(srcpath, 'utf8')
      const processed = contents.replaceAll('{{entrypath}}', entrypath).trim()

      await fs.writeFile(`${targetfolder}/${fragment.target}`, processed)
    }    
  } catch (err) {
    console.log('An error occured.', 'cleaning up ...')
    
    await fs.rm(targetfolder, { recursive: true, force: true })
    
    throw err 
  }
}

export { createExample, replaceTokensInFile }

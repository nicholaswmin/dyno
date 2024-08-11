import path from 'node:path'
import * as fs from 'node:fs/promises'

const dirname = import.meta.dirname

const replaceTokensInFile = async ({ 
  srcfolder, 
  filepath, 
  entrypath,
  tokens 
}) => {    
  entrypath = entrypath === 'index.js' ? './index.js' : entrypath

  for (const token of tokens) {
    const srcpath = path.join(dirname, `../${srcfolder}/${token.target}`)
    const contents = await fs.readFile(srcpath, 'utf8')
    const processed = contents.replaceAll('{{entrypath}}', entrypath)

    const existing = await fs.readFile(filepath, 'utf8')
    const n1 = existing.indexOf(token.start)
    const n2 = existing.indexOf(token.end, n1)
    const rm = existing.slice(0, n1) + existing.slice(n2)
    const res = `${rm.slice(0, n1)}${token.start}\n${processed}${rm.slice(n1)}`

    await fs.writeFile(filepath, res)
    
    console.log('replaced token:', `"${token.start}"`, 'in:', filepath)
  }
}

const createExample = async ({ 
  srcfolder, 
  targetfolder = '', 
  entrypath, 
  fragments 
}) => {
  entrypath = entrypath === 'index.js' ? './index.js' : entrypath

  try {
    await fs.rm(targetfolder, { recursive: true, force: true })
    if (targetfolder) await fs.mkdir(targetfolder)
    
    for (const fragment of fragments) {
      const srcpath = path.join(dirname, `../${srcfolder}/${fragment.target}`)
      const targetpath = targetfolder 
        ? `${targetfolder}/${fragment.target}` 
        : fragment.target
      const contents = await fs.readFile(srcpath, 'utf8')
      const processed = contents.replaceAll('{{entrypath}}', entrypath).trim()

      await fs.writeFile(targetpath, processed)
      
      console.log('created:', targetpath)
    }    
  } catch (err) {
    console.log('An error occured.', 'cleaning up ...')
    
    if (targetfolder)
      await fs.rm(targetfolder, { recursive: true, force: true })
    
    throw err 
  }
}

export { createExample, replaceTokensInFile }

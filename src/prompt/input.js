import { styleText } from 'node:util'
import readline from 'node:readline/promises'

const input = async ({ message, value, validate }) => {  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const render = async err => {
    if (err) console.log(styleText(['red'], err))
    
    const question = styleText(['cyan'],`${message}: (${value}) `)
    const answer = await rl.question(question).then(v => v.trim()) || value
    const valid = validate(answer)

    return valid === true ? (() => {
      rl.close()
      
      return answer
    })() : render(valid)
  }
  
  return render()
}

export { input }

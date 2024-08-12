import readline from 'node:readline/promises'

function newline() {
  ['test'].includes(process.env.NODE_ENV) 
    ? null
    : console.log('\n')
}

function warn({ message }) {
  newline()
  console.warn(`invalid input: ${message}`)
}

function done({ rl }) {

}

async function input({ message, value, validate }) {  
  const rl = readline.createInterface({
    input: process.stdin, output: process.stdout, terminal: false
  })
  
  rl.on('close', () => {
    rl.removeAllListeners()
    rl.close()
  })
  .once('SIGINT', () => {
    rl.removeAllListeners()
    rl.close()

    process.exit(1)
  }) 
  
  async function ask(lasterror = false) {
    lasterror ? warn({ message: lasterror }) : newline()

    const question = `${message}: (${value}) `
    const input    = await rl.question(question)
    const answer   = input.trim() || value
    const error    = validate(answer)

    return error === false ? (() => {
      rl.close()
      rl.removeAllListeners()
      
      return answer
    })() : ask(error)
  }

  return ask()
}

export default input

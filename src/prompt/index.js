import input from '@inquirer/input'

const types = {
  'string': String,
  'number': Number,
  'boolean': JSON.parse
}

const validateTypes = (obj, types) => {
  for (const key of Object.keys(obj)) {
    const t = typeof obj[key]

    if (!types[t])
      throw new TypeError(
        `Expected: ${key} to be: ${Object.keys(types).join(' or ')}, got: ${t}`
      )
  }
}

export default async (parameters, { skipUserInput = false } = {}) => {
  validateTypes(parameters, types)
  
  for (const key of Object.keys(parameters || {})) {
    const value = parameters[key]

    const answer = skipUserInput 
      ? value : await input({

      message: `Configure value for: ${key}`,
      default: value,

      validate: answer => {
        switch (typeof value) {
          case 'number':
            return Number.isInteger(+answer) && +answer > 0
              ? true : `${key} must be a positive integer`

          case 'string':
            return typeof answer === 'string' && answer.length > 0
              ? true : `${key} must be a string with length: > 0`

          case 'boolean':
            return ['true', 'false', true, false].includes(answer) 
              ? true : `${key} must be either "true" or "false"`

          default:
            throw new TypeError(`${key} has an invalid type: ${typeof value}`)
        }
      }
    })

    parameters[key] = types[typeof value](answer)
  }

  return Object.freeze(parameters)
}

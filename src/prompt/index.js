import { styleText } from 'node:util'
import input from './input.js'

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

export default async (parameters, { disabled = false, defaults = {} } = {}) => {
  parameters = { ...defaults, ...parameters }

  validateTypes(parameters, types)
  
  for (const key of Object.keys(parameters || {})) {
    const value = parameters[key]

    const answer = disabled ? value : await input({

      message: `Enter ${styleText(['cyan'], key)}`,

      value: value,

      validate: answer => {
        answer = typeof answer === 'string' ? answer.trim() : answer

        if (typeof answer === 'undefined' || answer === '')
          return 'must provide a value'
        
        switch (typeof value) {
          case 'number':
            return Number.isInteger(+answer) && +answer > 0
              ? false : 'must be a positive, non-fractional number'

          case 'string':
            return typeof answer === 'string' && answer.length > 0
              ? false : 'must be a string with some length'

          case 'boolean':
            return ['true', 'false', true, false].includes(answer) 
              ? false : 'must be either "true" or "false"'

          default:
            throw new TypeError(`${key} has an invalid type: ${typeof value}`)
        }
      }
    })

    parameters[key] = types[typeof value](answer)
  }

  return Object.freeze(parameters)
}

const validateString = (v, name = 'value') => {
  if (typeof v !== 'string')
    throw new TypeError(`${name} must be a: string, is: ${typeof v}`)
  
  if (v.length < 1)
    throw new RangeError(`${name} must have length, but is empty`)
  
  return v
}

const validateFn = (v, name = 'value') => {
  if (typeof v !== 'function')
    throw new TypeError(`${name} must be a: function, is: ${typeof v}`)
  
  return v
}

const validateIPCMessageName = v => {
  validateString(v.name, 'payload.name')

  if (!v.name.includes(':'))
    throw new RangeError(
      `payload.name must follow the "topic:event" format, got: ${v.name}`
    )
  
  return v
}

const validateIPCPayload = v => {
  if ((!v && v !== 0) || (typeof v !== 'object' || v === null))
    throw new TypeError(`payload must be an: object, is: ${typeof v}`)
  
  if (!Object.hasOwn(v, 'name'))
    throw new TypeError(`payload must have a "name" property`)
  
  return validateIPCMessageName(v)
}

export { 
  validateIPCMessageName, 
  validateIPCPayload, 
  validateString, 
  validateFn 
}

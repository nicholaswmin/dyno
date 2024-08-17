const validInt = (v, name) => {
  if (!Number.isInteger(v))
    throw new RangeError(`${name} must be an integer, has decimals: ${v}`)

  if (v <= 0)
    throw new RangeError(`${name} must be > 0, is: ${v}`)
  
  if (v > Number.MAX_SAFE_INTEGER)
    throw new RangeError(`${name} must be <= MAX_SAFE_INTEGER, is ${v}`)

  return v
}
  
const validObj = (v, name) => {
  if (typeof v === 'undefined')
    return v

  if (typeof v !== 'object')
    throw new TypeError(`${name} must be an object, is: ${typeof v}`)

  if (v === null)
    throw new TypeError(`${name} cannot be null, is: null`)

  if (Array.isArray(v))
    throw new RangeError(`${name} must be a non-Array object, is an Array.`)

  return v
}
  
const validStr = (v, name) => {
  if (typeof v === 'undefined' || v === null)
    return v

  if (typeof v !== 'string')
    throw new TypeError(`${name} must be a string, is: ${typeof v}`)

  if (v.length <= 0)
    throw new RangeError(`${name} is empty`)

  return v
}

export { validInt, validObj, validStr }

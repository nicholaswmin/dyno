class Measurement {
  constructor({ name, value }) {
    this.pid = this.#validateInteger(process.pid, 'pid')
    this.name = this.#validateString(name, 'name')
    this.value = this.#validateInteger(value, 'value')
  }
  
  #validateString(v, name = 'value') { 
    if (typeof v !== 'string')
      throw new TypeError(`${name} must be a: string, is: ${typeof v}`)
    
    if (v.length < 1)
      throw new RangeError(`${name} must have length > 0, is empty`)
    
    return v
  }
  
  #validateInteger(v, name = 'value') {
    if (typeof v !== 'number')
      throw new TypeError(`${name} must be a Number, is: ${typeof v}`)

    if (!Number.isInteger(v))
      throw new RangeError(`${name} must be an integer, has decimals: ${v}`)

    if (v <= 0)
      throw new RangeError(`${name} must be > 0, is: ${v}`)
    
    if (v > Number.MAX_SAFE_INTEGER)
      throw new RangeError(`${name} must be <= MAX_SAFE_INTEGER, is ${v}`)

    return v
  }
}

export default Measurement

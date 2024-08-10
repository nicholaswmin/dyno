const validatePositiveInteger = (v, name = 'value') => {
  if (!Number.isInteger(v))
    throw new TypeError(`expected: ${name} to be an integer, is: ${typeof v}`)

  if (v <= 0)
    throw new TypeError(`expected: ${name} to be > 0, is: ${v}`)

  return v
}

export { validatePositiveInteger }

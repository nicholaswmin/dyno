class RingBuffer extends Array {
  #size = 0

  constructor({ size = 100 } = {}) {
    super()
    this.#size = size
  }

  push(value) {
    if (this.length >= this.#size)
      super.shift()

    super.push(value)
  }
}

export default RingBuffer

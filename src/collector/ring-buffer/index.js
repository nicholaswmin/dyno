const { NODE_ENV } = process.env

class RingBuffer extends Array {
  #size = 0

  constructor({ size = ['test'].includes(NODE_ENV) ? 25 : 200 } = {}) {
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

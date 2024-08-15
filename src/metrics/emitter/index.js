import Measurement from './measurement/index.js'

const metric = name => {
  const bus = global.universalBus || (() => {
    throw new TypeError('Missing Bus() instance on: global.universalBus')
  })()
  const record = ({ name, value }) => 
    bus.emit(new Measurement({ name, value }))

  return {
    record: value => record({ name, value }),
    stop: () => bus.stop()
  }
}

export { metric }

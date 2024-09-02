import Measurement from './measurement/index.js'

const bus = global.globalBus || (() => {
  throw new TypeError('Missing GlobalBus() instance on: global.globalBus')
})()

const metric = name => {
  const record = ({ name, value }) => 
    bus.emit(new Measurement({ name, value }))

  return {
    record: value => record({ name, value }),
    stop: () => bus.stop()
  }
}

export { metric }

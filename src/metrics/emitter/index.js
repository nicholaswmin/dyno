import { Bus } from '../../bus/index.js'
import Measurement from './measurement/index.js'

const metric = name => {
  const bus = Bus()
  const record = ({ name, value }) => 
    bus.emit(new Measurement({ name, value }))

  return {
    record: value => record({ name, value }),
    stop: () => bus.stop()
  }
}

export { metric }

// emits `pong` in response to a `ping`
import { primary } from '../../index.js'

primary.on('ping', () => setImmediate(() => primary.emit('pong')))

// immediately emits `pong` in response to a `ping`
import { primary } from '../../index.js'

primary.on('ping', data => setImmediate(() => primary.emit('pong', data)))

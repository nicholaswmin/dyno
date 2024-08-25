// - runs ok & exits when asked to
// - sends back its ENV variables when asked to 
import { primary } from '../../index.js'

process.on('message', message => {  
  if (message === 'env')
    return process.send(['env', process.env])
})

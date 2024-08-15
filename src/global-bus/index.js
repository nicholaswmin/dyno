import GlobalBus from './bus/index.js'
import process from './process/index.js'

// @NOTE 
// this global scope pollution is an 
// intentional design-choice
global.globalBus = GlobalBus()
global.process = process

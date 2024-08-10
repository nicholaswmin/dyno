import { styleText } from 'node:util'
import asciichart from 'asciichart'

import View from '../view/index.js'

class Plot extends View {
  constructor(title = 'Plot', { 
    height = 10, 
    subtitle = '', 
    properties = [] 
  } = {}) {
    super()

    this.unit = 'mean'
    this.properties = properties
    this.colors = [
      'magenta', 'blue', 'cyan', 'green', 'yellow', 
      'lightmagenta', 'lightblue', 'lightcyan', 'lightgreen', 'lightyellow'
    ]
    
    this.config = { subtitle, height, padding: '       ' }
    this.padding = ' '.repeat(this.config.padding.length - 5)
    this.chart = `\n${this.padding}${title}\n\n`
    
    if (!properties.length)
      throw new RangeError('must specify at least 1 property')

    return this
  }
  
  plot(obj) {
    if (!obj)
      return this
    
    const br = '\n'.repeat(2)
    const keys = Object.keys(obj).filter(key => this.properties.includes(key))
    const cols = keys.map((_, i) => this.colors[i])
    const colors = cols.map(color => asciichart[color])
    const labels = keys.map((key, i) => styleText([cols[i]], `-- ${key}`))
    const arrays = keys
      .map(key => obj[key].map(hgram => hgram[this.unit]).sort((a, b) => b - a))
      .filter(array => array.length)
    
    try {
      this.chart += labels.reduce((acc, label) => acc += `  ${label}`, '') + br
      this.chart += asciichart.plot(arrays, { ...this.config, colors })    
      this.chart += this.config.subtitle 
        ? `${br}${this.padding}${this.config.subtitle}${br}`
        : br
    } catch (err) {
      console.log('arrays:', arrays)
      
      throw err
    }
    
    return this
  }
  
  render() {
    return super.render(this.chart.toString())
  }
}

export default Plot

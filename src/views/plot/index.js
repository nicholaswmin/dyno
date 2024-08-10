import { styleText } from 'node:util'
import asciichart from 'asciichart'

import View from '../view/index.js'

class Plot extends View {
  constructor(title = 'Plot', obj, { 
    height = 10, 
    subtitle = '', 
    exclude = [] 
  } = {}) {
    super()

    this.unit = 'mean'
    this.exclude = exclude
    this.colors = [
      'magenta', 'blue', 'cyan', 'green', 'yellow', 
      'lightmagenta', 'lightblue', 'lightcyan', 'lightgreen', 'lightyellow'
    ]
    
    this.config = { subtitle, height, padding: '       ' }
    this.padding = ' '.repeat(this.config.padding.length - 5)
    this.chart = `\n${this.padding}${title}\n\n`
    
    return this.#plot(obj)
  }
  
  #plot(obj) {
    if (!obj)
      return this

    const br = '\n'.repeat(2)
    const keys = Object.keys(obj).filter(key => !this.exclude.includes(key))
    const cols = keys.map((_, i) => this.colors[i])
    const colors = cols.map(color => asciichart[color])
    const labels = keys.map((key, i) => styleText([cols[i]], `-- ${key}`))
    const arrays = keys
      .filter(key => !!obj[key])
      .map(key => obj[key].snapshots)
      .map(snaps => snaps.map(hgram => hgram[this.unit]).sort((a, b) => b - a))
      .filter(array => array.length)
    
    if (!arrays.length)
      return this

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

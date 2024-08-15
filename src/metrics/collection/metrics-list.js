// Provides a fluent API for querying metrics.
// 
// i.e `console.table(foo.tasks().metrics().pick('mean'))`

import { Metric, Metrics } from './index.js'

const round = num => {
  return Math.round((num + Number.EPSILON) * 100) / 100 || 'n/a'
}

const throwOnMissingUnit = unit => {
  if (typeof unit === 'undefined')
    throw new TypeError('missing "unit" argument')
  
  return unit
}

class MetricsList extends Array {
  #ppid = process.pid.toString() 
  #_only = []
  
  constructor(...args) {
    super(...args)
  }

  primary() {
    return this.filter(value => value instanceof Metrics)
      .filter(metrics => metrics.pid == this.#ppid)
  }
  
  threads() {
    return this.filter(value => value instanceof Metrics)
      .filter(metrics => metrics.pid !== this.#ppid)
  }
  
  only(...args) {
    this.#_only = args
    
    return this
  }
  
  sortBy(key = '', direction = 'asc') {
    if (!Array.isArray(this))
      return    

    if (typeof key !== 'string' || !key)
      throw new TypeError('sorting key must be a non-empty string')

    if (!['asc', 'desc'].includes(direction))
      throw new RangeError('sorting direction can only be: "asc" or "desc"')
    
    if (this.length > 0 && typeof this[0][key] === 'undefined') 
      throw new RangeError(`sorting key: ${key} does not exist`)

    return this.sort((a, b) => {
      return direction === 'asc' ? a[key] - b[key] : b[key] - a[key]
    })
  }

  of(unit) {
    unit = throwOnMissingUnit(unit)

    this.forEach(item => {
      Object.keys(item).forEach(key => {
        item[key] = Array.isArray(item[key]) 
          ? item[key].map(item => round(item[unit]))
          : item[key]
      })
    })

    return this
  }

  pick(unit) {
    unit = throwOnMissingUnit(unit)

    return this.map((metrics, i) => Object.keys(metrics)
        .filter(key => metrics[key] instanceof Metric)
        .filter(key => this.#_only.length ? this.#_only.includes(key) : true)
        .reduce((acc, key) => ({
        ...acc, 
        [key]: typeof metrics[key][unit] == 'number' 
        ? round(metrics[key][unit]) :
          metrics[key][unit]
      }), {}))
      .filter(metric => Object.keys(metric).length > 0)
  }
  
  group() {
    return this
      .reduce((acc, item) => Object.keys(item)
      .reduce((acc, key) => ({ ...acc, [key]: item[key] }), {}), {})
  }
}

export default MetricsList

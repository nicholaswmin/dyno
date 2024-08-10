import { AsciiTable3 } from 'ascii-table3'

import View from '../view/index.js'

class Table extends View {
  constructor(title, rows = []) {
    super()

    this.table = new AsciiTable3(title)
    this.rows = Array.isArray(rows) ? rows : [rows]
    this.values = this.rows.map(row => Object.values(row)
      .map(v => typeof v === 'undefined' || isNaN(v) ? 'n/a' : v))

    this.table
      .setHeading(...Object.keys(this.rows[0] || {}))
      .addRowMatrix(this.values)

    return this
  }
  
  render() {
    return super.render(this.rows.length ? this.table.toString() : 'no rows')
  }
}

export default Table

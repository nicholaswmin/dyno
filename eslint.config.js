// requires a global eslint: `npm i -g @eslint/js`

import globals from 'globals'

export default [
  { languageOptions: { globals: globals.node }}
]

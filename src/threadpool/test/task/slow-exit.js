// takes too long to exit
// then mocks you as an added bonus

import { setTimeout } from 'node:timers/promises'

await setTimeout(10 * 1000)

console.error('IM A ZOMBIE CHILD PROCESS U DIDNT KILL. STILL ALIVE! MUAHHAA!')

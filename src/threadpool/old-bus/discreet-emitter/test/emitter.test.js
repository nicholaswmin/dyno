import test from 'node:test'
import { EventEmitter, listenerCount } from 'node:events'
import { DiscreetEmitter } from '../index.js'

test('#DiscreetEmitter()', async t => {
  let vanillaEmitter, discreetEmitter

  t.beforeEach(() => {
    vanillaEmitter = new EventEmitter()
    discreetEmitter = new DiscreetEmitter(vanillaEmitter)
  })
  
  await t.test('previously setup handlers work', (t, done) => {    
    vanillaEmitter.once('foo', done)
    vanillaEmitter.emit('foo')
  })

  await t.test('subsequent handler setup works ', (t, done) => {
    function foo() { done() }

    discreetEmitter.removeTrackedListeners()

    discreetEmitter.once('foo', foo)
    discreetEmitter.emit('foo')
  })
  
  await t.test('emitting on prev. bound handlers is ignored', (t, done) => {
    function foo() { done() }

    function bar() { done(new Error('must not be called')) } 
    function baz() { done(new Error('must not be called')) } 

    vanillaEmitter.on('foo', foo)

    discreetEmitter.once('bar', bar);  
    discreetEmitter.removeTrackedListeners()
    discreetEmitter.emit('bar', bar)
    discreetEmitter.emit('baz', bar)

    vanillaEmitter.emit('foo')
  })
  
  await t.test('existing handlers are unaffected', (t, done) => {    
    discreetEmitter.on('foo', () => done(new Error('must not be called'))) 
    vanillaEmitter.on('foo', () => { done() })

    discreetEmitter.removeTrackedListeners()
    
    vanillaEmitter.emit('foo')
  })
  
  await t.test('removeing own listeners lowers listener count', (t, done) => {
    const discreetEmitter = new DiscreetEmitter(vanillaEmitter)

    discreetEmitter.once('foo', () => {})  
    discreetEmitter.once('foo', () => {})  

    const prevCount = listenerCount(discreetEmitter, 'foo')
    discreetEmitter.removeTrackedListeners()
    discreetEmitter.once('foo', () => {})  
    const newCount = listenerCount(discreetEmitter, 'foo')
    
    t.assert.strictEqual(prevCount, 2)
    t.assert.strictEqual(newCount, 1)
    done()
  })

  await t.test('can run multiple instances side-by-side', (t, done) => {
    const first = new DiscreetEmitter(vanillaEmitter), 
          second = new DiscreetEmitter(vanillaEmitter)

    first.once('foo', () => done(new Error('must not be called'))) 
    second.once('foo', () => done(new Error('must not be called'))) 
    
    second.removeTrackedListeners()
    first.removeTrackedListeners()

    first.once('bar', () => done()) 
    first.emit('bar')
    second.emit('bar')
  })
  
  await t.test('works as a superclass', (t, done) => {
    class FancyEmitter extends DiscreetEmitter {
      constructor() {
        super()
      }
    }
    
    const fancy = new FancyEmitter()
    
    fancy.once('foo', () => {
      done(Error('must not be called'))
    })
    
    fancy.removeTrackedListeners()

    fancy.on('bar', () => done())

    fancy.emit('foo')
    fancy.emit('bar')
  })
  
  await t.test('works standalone', (t, done) => {
    const first = new DiscreetEmitter()

    first.once('foo', () => done()) 

    first.emit('foo')
  })
})

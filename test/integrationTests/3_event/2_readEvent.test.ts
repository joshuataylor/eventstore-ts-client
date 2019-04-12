import {expect} from 'chai'
import {Eventstore, Event} from '../../../src'
import * as assert from 'assert'
import {stringify} from 'querystring'

describe('Read events from stream', (): void => {
  const es = new Eventstore({
    clientId: 'ts-client-test',
    credentials: {
      username: 'restrictedUser',
      password: 'restrictedOnlyUserPassword'
    }
  })
  before(
    async (): Promise<void> => {
      await es.connect()
    }
  )

  after(
    async (): Promise<void> => {
      await es.disconnect()
    }
  )

  it('reads a slice forward', async (): Promise<void> => {
    const stream = await es.stream('teneventsstream-ad44caa8-d701-48f2-ac1e-2ec147ff1df5')
    const result = await stream.readSliceForward(0)
    assert.notStrictEqual(result, undefined)
    assert.notStrictEqual(result, null)
    assert.strictEqual(result.isEndOfStream, true)
    assert.strictEqual(result.events.length, 10)
    for (let x = 0, xMax = result.events.length; x < xMax; x++) {
      const event = Event.fromRaw(result.events[x].event)
      const data = event.data
      assert.strictEqual(data.count, x + 1)
    }
  })
})

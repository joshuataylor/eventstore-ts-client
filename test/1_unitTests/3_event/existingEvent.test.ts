import {Event} from '../../../src'
import * as assert from 'assert'
import uuid = require('uuid/v4')
import {uuidToBuffer} from '../../../src/protobuf/uuidBufferConvert'

interface TestEventDataSchema {
  someString: string
  someNumber: number
  someBoolean: boolean
  someObject: {
    moreText: string
    otherNumber: number
    otherBoolean: boolean
  }
}

describe('Existing event instance tests', (): void => {
  const testData: TestEventDataSchema = {
    someString: 'some text',
    someNumber: 100,
    someBoolean: true,
    someObject: {
      moreText: 'something more',
      otherNumber: 200,
      otherBoolean: false
    }
  }

  const testMetadata = {
    $correlationId: uuid()
  }

  it('returns false on existing event', (): void => {
    const existingEvent = new Event('EventWasHappened', {...testData}, {...testMetadata})
    existingEvent.freeze()
    assert.strictEqual(existingEvent.isNew(), false)
  })

  it('throws on changing name', (): void => {
    const existingEvent = new Event('EventWasHappened', {...testData}, {...testMetadata})
    existingEvent.freeze()
    const newName = 'EventRenamed'
    try {
      existingEvent.name = newName
      assert.fail('has not thrown')
    } catch (err) {
      assert.strictEqual(err.name, 'EventstoreOperationError')
    }
  })

  it('throws on changing eventId', (): void => {
    const existingEvent = new Event('EventWasHappened', {...testData}, {...testMetadata})
    existingEvent.freeze()
    const newId = uuid()
    try {
      existingEvent.id = newId
      assert.fail('has not thrown')
    } catch (err) {
      assert.strictEqual(err.name, 'EventstoreOperationError')
    }
  })

  it('throws on changing eventData', (): void => {
    const existingEvent = new Event('EventWasHappened', {...testData}, {...testMetadata})
    existingEvent.freeze()
    const newData = {...testData, ...{someString: 'I was changed'}}
    try {
      existingEvent.data = newData
      assert.fail('has not thrown')
    } catch (err) {
      assert.strictEqual(err.name, 'EventstoreOperationError')
    }
  })

  it('throws on changing eventMetadata', (): void => {
    const existingEvent = new Event('EventWasHappened', {...testData}, {...testMetadata})
    existingEvent.freeze()
    const newMetadata = {somethingNew: uuid()}
    try {
      existingEvent.metadata = newMetadata
      assert.fail('has not thrown')
    } catch (err) {
      assert.strictEqual(err.name, 'EventstoreOperationError')
    }
  })

  it('throws on changing eventCorrelationId', (): void => {
    const existingEvent = new Event('EventWasHappened', {...testData}, {...testMetadata})
    existingEvent.freeze()
    const newCorrelationId = uuid()
    try {
      existingEvent.correlationId = newCorrelationId
      assert.fail('has not thrown')
    } catch (err) {
      assert.strictEqual(err.name, 'EventstoreOperationError')
    }
  })
})

describe('event from raw', (): void => {
  const rawEventId = uuid()
  const rawEventStreamId = 'stream-' + uuid()
  const rawCorrelationId = uuid()
  const rawEventData = {
    someField: 'someValue',
    someNumber: 100
  }
  const rawEventMetadata = {
    $correlationId: rawCorrelationId
  }

  const rawEventWithMeta = {
    eventType: 'SomethingWasHappened',
    eventStreamId: rawEventStreamId,
    eventNumber: 1,
    eventId: uuidToBuffer(rawEventId),
    dataContentType: 1,
    metadataContentType: 1,
    data: Buffer.from(JSON.stringify(rawEventData)),
    metadata: Buffer.from(JSON.stringify(rawEventMetadata)),
    created: Date.now(),
    createdEpoch: Date.now()
  }

  const rawEventWithoutMeta = {
    eventType: 'SomethingWasHappened',
    eventStreamId: rawEventStreamId,
    eventNumber: 1,
    eventId: uuidToBuffer(rawEventId),
    dataContentType: 1,
    metadataContentType: 1,
    data: Buffer.from(JSON.stringify(rawEventData)),
    metadata: null,
    created: null,
    createdEpoch: null
  }

  it('returns event instance with full metadata', (): void => {
    const newEvent = Event.fromRaw(rawEventWithMeta)
    assert.strictEqual(newEvent.name, 'SomethingWasHappened')
    assert.strictEqual(newEvent.streamId, rawEventStreamId)
    assert.strictEqual(newEvent.data.toString(), rawEventData.toString())
    assert.strictEqual(newEvent.metadata.toString(), rawEventMetadata.toString())
    assert.strictEqual(newEvent.correlationId, rawEventMetadata.$correlationId)
  })

  it('returns event instance without metadata', (): void => {
    const newEvent = Event.fromRaw(rawEventWithoutMeta)
    assert.strictEqual(newEvent.name, 'SomethingWasHappened')
    assert.strictEqual(newEvent.streamId, rawEventStreamId)
    assert.strictEqual(newEvent.data.toString(), rawEventData.toString())
    assert.strictEqual(newEvent.metadata, null)
    assert.strictEqual(newEvent.correlationId, null)
  })

  it('returns event instance without created information', (): void => {
    const raw = {...rawEventWithMeta}
    delete raw.created
    delete raw.createdEpoch
    const newEvent = Event.fromRaw(rawEventWithMeta)
    assert.strictEqual(newEvent.name, 'SomethingWasHappened')
    assert.strictEqual(newEvent.streamId, rawEventStreamId)
    assert.strictEqual(newEvent.data.toString(), rawEventData.toString())
    assert.strictEqual(newEvent.metadata.toString(), rawEventMetadata.toString())
    assert.strictEqual(newEvent.correlationId, rawEventMetadata.$correlationId)
  })

  it('sets metadata on setting correlationId', (): void => {
    const newEvent = new Event('SomethingWasHappened')
    newEvent.correlationId = rawEventMetadata.$correlationId
    const expected = {
      $correlationId: rawEventMetadata.$correlationId
    }
    assert.strictEqual(newEvent.metadata.toString(), expected.toString())
  })

  it('deletes correlationId also from metadata', (): void => {
    const newEvent = new Event(
      'SomethingWasHappened',
      {},
      {$correlationId: rawEventMetadata.$correlationId}
    )
    newEvent.correlationId = null
    const expected = {}
    assert.strictEqual(newEvent.metadata.toString(), expected.toString())
  })

  it('deletes correlationId', (): void => {
    const newEvent = new Event('SomethingWasHappened', {}, {})
    newEvent.correlationId = null
    const expected = {}
    assert.strictEqual(newEvent.metadata.toString(), expected.toString())
  })

  it('returns null for correlationId if not set', (): void => {
    const newEvent = new Event('SomethingWasHappened', {}, {})
    newEvent.correlationId = null
    assert.strictEqual(newEvent.correlationId, null)
  })

  it('throw on missing raw event or link', (): void => {
    try {
      Event.fromRaw(null)
      assert.fail('has not thrown')
    } catch (err) {
      assert.strictEqual(err.name, 'EventstoreProtocolError')
    }
  })
})

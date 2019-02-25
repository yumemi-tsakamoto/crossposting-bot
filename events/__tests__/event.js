'use strict'

const { event } = require('../../handler')

jest.mock('../../adapters/cloudwatch')

describe('events', () => {
  test('入力がJSONでない場合は何もしない', async () => {
    const res = event({ body: 'Hello' })
    await expect(res).resolves.toBeUndefined()
  })
  test('イベントタイプが不明な場合は何もしない', async () => {
    const data = {
      api_app_id: 'A00000000',
      event: {
        type: 'unknown',
      },
      event_id: 'Ev00000000',
    }
    const res = event({ body: JSON.stringify(data) })
    await expect(res).resolves.toHaveProperty('body', 'unknown_event')
  })
  test('イベントIDが重複した場合は何もしない', async () => {
    const data = {
      api_app_id: 'A00000000',
      event: {
        type: 'unknown',
      },
      event_id: 'Ev00000000',
    }
    const res = event({ body: JSON.stringify(data) })
    await expect(res).resolves.toHaveProperty('body', 'duplicate_event')
  })
})

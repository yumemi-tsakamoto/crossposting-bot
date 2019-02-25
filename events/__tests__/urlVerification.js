'use strict'

const { event } = require('../../handler')

jest.mock('../../adapters/cloudwatch')

describe('events/url_verification', () => {
  describe('SlackのEvent Subscriptionの設定時に認証アクセスが発生する', () => {
    test('url_verificationを正しく処理する', async () => {
      const data = {
        token: 'XXYYZZ',
        challenge: 'XXXXXXXXXX',
        type: 'url_verification',
      }
      const res = event({ body: JSON.stringify(data) })
      await expect(res).resolves.toHaveProperty('body', data.challenge)
    })
  })
})

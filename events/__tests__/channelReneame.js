'use strict'

const uniqid = require('uniqid')
const { event } = require('../../handler')
const dynamodb = require('../../adapters/dynamodb')

jest.mock('aws-sdk')
jest.mock('../../adapters/cloudwatch')

const handler = payload => {
  const data = {
    token: 'XXYYZZ',
    team_id: 'T00000000',
    api_app_id: 'A00000000',
    event: payload,
    type: 'event_callback',
    authed_users: ['U00000001', 'U00000002'],
    event_id: uniqid.time('Ev'),
    event_time: 1234567890,
  }
  return event({ body: JSON.stringify(data) })
}

describe('events/channel_rename', () => {
  describe('チャンネル名を変更すると channel_rename イベントが届く', () => {
    test('新規チャンネル情報はDBに登録される', async () => {
      const data = {
        type: 'channel_rename',
        channel: {
          id: 'C00000100',
          name: 'nameFooBar',
          created: 1360782804,
        },
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'updated')

      const user = dynamodb.get({
        TableName: dynamodb.table.CHANNEL,
        Key: { id: 'C00000100', appid: 'A00000000' },
      })
      await expect(user).resolves.toHaveProperty('name', 'nameFooBar')
    })

    test('更新されたチャンネル情報でDBが更新される', async () => {
      const data = {
        type: 'channel_rename',
        channel: {
          id: 'C00000100',
          name: 'nameFooBarBoo',
          created: 1360782804,
        },
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'updated')

      const user = dynamodb.get({
        TableName: dynamodb.table.CHANNEL,
        Key: { id: 'C00000100', appid: 'A00000000' },
      })
      await expect(user).resolves.toHaveProperty('name', 'nameFooBarBoo')
    })

    test('パラメータが足りない場合は失敗する', async () => {
      const data = {
        type: 'channel_rename',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'not_enough_params')
    })
  })
})

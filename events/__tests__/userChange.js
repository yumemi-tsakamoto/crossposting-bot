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

describe('events/user_change', () => {
  describe('ユーザー情報が更新されると user_change イベントが発生する', () => {
    test('新規ユーザー情報はDBに登録される', async () => {
      const data = {
        type: 'user_change',
        user: {
          id: 'U00000100',
          name: 'name',
          created: 1360782804,
          profile: {
            first_name: 'John',
            last_name: 'Smith',
            email: 'john@smith.com',
          },
        },
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'updated')

      const user = dynamodb.get({
        TableName: dynamodb.table.USER,
        Key: { id: 'U00000100', appid: 'A00000000' },
      })
      await expect(user).resolves.toHaveProperty('name', 'name')
    })

    test('更新されたユーザー情報でDBが更新される', async () => {
      const data = {
        type: 'user_change',
        user: {
          id: 'U00000100',
          name: 'nameFooBar',
          created: 1360782804,
          profile: {
            first_name: 'John',
            last_name: 'Smith',
            email: 'john@smith.com',
          },
        },
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'updated')

      const user = dynamodb.get({
        TableName: dynamodb.table.USER,
        Key: { id: 'U00000100', appid: 'A00000000' },
      })
      await expect(user).resolves.toHaveProperty('name', 'nameFooBar')
    })

    test('パラメータが足りない場合は失敗する', async () => {
      const data = {
        type: 'user_change',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'not_enough_params')
    })
  })
})

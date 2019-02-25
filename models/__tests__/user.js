'use strict'

const User = require('../user')
const slack = require('../../adapters/slack')
const dynamodb = require('../../adapters/dynamodb')

jest.mock('aws-sdk')
jest.mock('@slack/client')
jest.mock('../../adapters/cloudwatch')

describe('model/user', () => {
  const dynamodbGet = jest.spyOn(dynamodb, 'get')
  dynamodbGet.mockImplementation(() =>
    Promise.resolve({
      id: 'U00000000',
      name: 'testuser',
      channels: ['C00000000'],
    })
  )

  const slackGetUser = jest.spyOn(slack, 'getUser')
  slackGetUser.mockImplementation(() =>
    Promise.resolve({ id: 'U00000000', name: 'testuser_slack' })
  )

  const putDb = jest.spyOn(dynamodb, 'put')

  describe('必須パラメータが無い場合はエラーとなる', async () => {
    test('AppIDがない場合はエラーが返る', async () => {
      const user = new User()
      const res = user.load('U00000000')
      await expect(res).rejects.toThrow('user_not_found')
    })
    test('UserIDがない場合はエラーが返る', async () => {
      const user = new User('A00000000')
      const res = user.load()
      await expect(res).rejects.toThrow('user_not_found')
    })
    test('両方ある場合は成功する', async () => {
      const user = new User('A00000000')
      const res = user.load('U00000000')
      await expect(res).resolves.toBeUndefined()
    })
  })

  describe('loadで情報を取得する', async () => {
    test('DBから情報取得', async () => {
      const user = new User('A00000000')
      await user.load('U00000000')
      const info = user.get()
      await expect(info).resolves.toHaveProperty('name', 'testuser')
    })
    test('DBがエラーの場合はSlackから取得してDBに保存', async () => {
      dynamodbGet.mockImplementationOnce(() => Promise.reject(new Error()))

      const user = new User('A00000000')
      await user.load('U00000000')
      const info = user.get()
      await expect(info).resolves.toHaveProperty('name', 'testuser_slack')

      const res = putDb.mock.calls[0][0]
      expect(res).toHaveProperty('TableName', dynamodb.table.USER)
      expect(res).toHaveProperty('Item.name', 'testuser_slack')
    })

    test('両方エラーの場合はエラーが返る', async () => {
      dynamodbGet.mockImplementationOnce(() => Promise.reject(new Error()))
      slackGetUser.mockImplementationOnce(() => Promise.reject(new Error()))
      const user = new User('A00000000')
      const res = user.load('U00000000')
      await expect(res).rejects.toThrow('user_not_found')
    })

    test('複数回同じユーザーをロードしても再取得はしない', async () => {
      const cnt = dynamodbGet.mock.calls.length
      const user = new User('A00000000')
      await user.load('U00000000')
      await user.load('U00000000')
      await user.load('U00000000')
      expect(dynamodbGet).toBeCalledTimes(cnt + 1)
    })
  })

  describe('情報を更新できる', async () => {
    const user = new User('A00000000')

    test('infoに書き込む', async () => {
      const data = {
        id: 'U00000000',
        name: 'newName',
        icon: 'http://',
      }
      await user.set(data)
      const info = user.get()
      await expect(info).resolves.toHaveProperty('name', 'newName')
    })

    test('更新はidが必須項目', async () => {
      // idのみで成功
      const res = user.set({ id: 'U00000000' })
      await expect(res).resolves.toBeUndefined()
      // id以外だけだと失敗
      const res2 = user.set({ name: 'newName' })
      await expect(res2).rejects.toThrow('required_parameter_missing')
    })

    test('更新したあとsaveするとDBに反映される', async () => {
      // idのみで成功
      await user.set({ id: 'U00000000', name: 'newHappyName' })
      await user.save()

      const res = putDb.mock.calls[1][0]
      expect(res).toHaveProperty('TableName', dynamodb.table.USER)
      expect(res).toHaveProperty('Item.name', 'newHappyName')
    })
  })

  describe('チャンネルを管理できる', async () => {
    const user = new User('A00000000')

    beforeAll(async () => {
      await user.load('U00000000')
    })

    test('チャンネルを追加', async () => {
      await user.addChannel('C00000001')
      const ch = user.getChannels()
      await expect(ch).resolves.toEqual(['C00000000', 'C00000001'])
    })

    test('チャンネルを追加するとDBに保存される', async () => {
      const res = putDb.mock.calls[2][0]
      expect(res).toHaveProperty('TableName', dynamodb.table.USER)
      expect(res).toHaveProperty('Item.channels', ['C00000000', 'C00000001'])
    })

    test('チャンネルの重複追加はエラーが返る', async () => {
      const res = user.addChannel('C00000001')
      await expect(res).rejects.toThrow('channel_duplicate')
    })

    test('チャンネルを削除', async () => {
      await user.delChannel('C00000001')
      const ch = user.getChannels()
      await expect(ch).resolves.toEqual(['C00000000'])
    })

    test('チャンネルを削除するとDBに保存される', async () => {
      const res = putDb.mock.calls[3][0]
      expect(res).toHaveProperty('TableName', dynamodb.table.USER)
      expect(res).toHaveProperty('Item.channels', ['C00000000'])
    })

    test('削除チャンネルが未登録の場合はエラーが返る', async () => {
      const res = user.delChannel('C00000001')
      await expect(res).rejects.toThrow('channel_not_list')
    })
  })
})

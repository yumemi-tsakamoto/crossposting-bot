'use strict'

const Channel = require('../channel')
const slack = require('../../adapters/slack')
const dynamodb = require('../../adapters/dynamodb')

jest.mock('aws-sdk')
jest.mock('@slack/client')
jest.mock('../../adapters/cloudwatch')

describe('model/channel', () => {
  const dynamodbGet = jest.spyOn(dynamodb, 'get')
  dynamodbGet.mockImplementation(() =>
    Promise.resolve({
      id: 'C00000000',
      name: 'testchannel',
    })
  )
  const dynamodbQuery = jest.spyOn(dynamodb, 'query')
  dynamodbQuery.mockImplementation(() =>
    Promise.resolve([
      {
        id: 'C00000000',
        name: 'testchannel',
      },
    ])
  )

  const slackGetChannel = jest.spyOn(slack, 'getChannel')
  slackGetChannel.mockImplementation(() =>
    Promise.resolve({ id: 'C00000000', name: 'testchannel_slack' })
  )

  const slackGetChannels = jest.spyOn(slack, 'getChannels')
  slackGetChannels.mockImplementation(() =>
    Promise.resolve([{ id: 'C00000000', name: 'testchannel' }])
  )

  const putDb = jest.spyOn(dynamodb, 'put')

  describe('必須パラメータが無い場合はエラーとなる', async () => {
    test('AppIDがない場合はエラーが返る', async () => {
      const ch = new Channel()
      const res = ch.load('U00000000')
      await expect(res).rejects.toThrow('channel_not_found')
    })
    test('ChannelIDがない場合はエラーが返る', async () => {
      const ch = new Channel('A00000000')
      const res = ch.load()
      await expect(res).rejects.toThrow('channel_not_found')
    })
    test('両方ある場合は成功する', async () => {
      const ch = new Channel('A00000000')
      const res = ch.load('C00000000')
      await expect(res).resolves.toBeUndefined()
    })
  })

  describe('loadで情報を取得する', async () => {
    test('DBから情報取得', async () => {
      const ch = new Channel('A00000000')
      await ch.load('C00000000')
      const info = ch.get()
      await expect(info).resolves.toHaveProperty('name', 'testchannel')
    })

    test('チャンネル名でも情報取得可能', async () => {
      const ch = new Channel('A00000000')
      const res = ch.load('#testchannel')
      await expect(res).resolves.toBeUndefined()
      const info = ch.get()
      await expect(info).resolves.toHaveProperty('id', 'C00000000')
    })

    test('DBがエラーの場合はSlackから取得してDBに保存（IDで取得）', async () => {
      dynamodbGet.mockImplementationOnce(() => Promise.reject(new Error()))

      const ch = new Channel('A00000000')
      await ch.load('C00000000')
      const info = ch.get()
      await expect(info).resolves.toHaveProperty('name', 'testchannel_slack')

      const res = putDb.mock.calls[0][0]
      expect(res).toHaveProperty('TableName', dynamodb.table.CHANNEL)
      expect(res).toHaveProperty('Item.name', 'testchannel_slack')
    })

    test('DBになかったらSlackから情報取得してDBに保存（チャンネル名で取得）', async () => {
      dynamodbQuery.mockImplementationOnce(() => Promise.reject(new Error()))

      const ch = new Channel('A00000000')
      const res = ch.load('#testchannel')
      await expect(res).resolves.toBeUndefined()
      const info = ch.get()
      await expect(info).resolves.toHaveProperty('id', 'C00000000')

      const res2 = putDb.mock.calls[1][0]
      expect(res2).toHaveProperty('TableName', dynamodb.table.CHANNEL)
      expect(res2).toHaveProperty('Item.name', 'testchannel')
    })

    test('両方エラーの場合はエラーが返る（IDで取得）', async () => {
      dynamodbGet.mockImplementationOnce(() => Promise.reject(new Error()))
      slackGetChannel.mockImplementationOnce(() => Promise.reject(new Error()))
      const ch = new Channel('A00000000')
      const res = ch.load('C00000000')
      await expect(res).rejects.toThrow('channel_not_found')
    })

    test('両方エラーの場合はエラーが返る（チャンネル名で取得）', async () => {
      dynamodbQuery.mockImplementationOnce(() => Promise.reject(new Error()))
      slackGetChannels.mockImplementationOnce(() => Promise.reject(new Error()))
      const ch = new Channel('A00000000')
      const res = ch.load('#testchannel')
      await expect(res).rejects.toThrow('channel_not_found')
    })

    test('チャンネルリンクでも情報取得可能', async () => {
      const ch = new Channel('A00000000')
      await ch.load('<#C00000000|testchannel>')
      const info = ch.get()
      await expect(info).resolves.toHaveProperty('id', 'C00000000')
    })

    test('チャンネル検索ができない文字列はエラー', async () => {
      const ch = new Channel('A00000000')
      const res = ch.load('Hello')
      await expect(res).rejects.toThrow('channel_not_found')
    })

    test('複数回同じチャンネルをロードしても再取得はしない', async () => {
      const cnt = dynamodbGet.mock.calls.length
      const ch = new Channel('A00000000')
      await ch.load('C00000000')
      await ch.load('C00000000')
      await ch.load('#testchannel')
      await ch.load('#testchannel')
      await ch.load('<#C00000000|testchannel>')
      await ch.load('<#C00000000|testchannel>')
      expect(dynamodbGet).toBeCalledTimes(cnt + 1)
    })
  })

  describe('情報を更新できる', async () => {
    const ch = new Channel('A00000000')

    test('infoに書き込む', async () => {
      const data = {
        id: 'U00000000',
        name: 'newName',
      }
      await ch.set(data)
      const info = ch.get()
      await expect(info).resolves.toHaveProperty('name', 'newName')
    })

    test('更新はidが必須項目', async () => {
      // idのみで成功
      const res = ch.set({ id: 'C00000000' })
      await expect(res).resolves.toBeUndefined()
      // id以外だけだと失敗
      const res2 = ch.set({ name: 'newName' })
      await expect(res2).rejects.toThrow('required_parameter_missing')
    })

    test('更新したあとsaveするとDBに反映される', async () => {
      // idのみで成功
      await ch.set({ id: 'C00000000', name: 'newHappyName' })
      await ch.save()

      const res = putDb.mock.calls[2][0]
      expect(res).toHaveProperty('TableName', dynamodb.table.CHANNEL)
      expect(res).toHaveProperty('Item.name', 'newHappyName')
    })
  })
})

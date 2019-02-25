const slack = require('../slack')
jest.mock('@slack/client')
jest.mock('../cloudwatch')

describe('adapters/slack', () => {
  describe('postMessage()', () => {
    test('チャンネルにメッセージを投稿', async () => {
      const data = {
        appid: 'A00000000',
        username: 'KintaiBot',
        icon_url: '-',
        text: 'Hello',
        channels: ['C00000000'],
      }
      const res = slack.postMessage(data)
      await expect(res).resolves.toBeDefined()
    })
    test('パラメータが足りない場合は失敗する', async () => {
      const data = {}
      const res = slack.postMessage(data)
      await expect(res).rejects.toThrow('not_enough_params')
    })
  })

  describe('bot()', () => {
    test('BOTのDMに返事を返す', async () => {
      const data = {
        appid: 'A00000000',
        channel: 'C00000000',
        text: 'Hello',
      }
      const res = slack.bot(data)
      await expect(res).resolves.toBeDefined()
    })
  })

  describe('reaction()', () => {
    test('valid', async () => {
      const data = {
        appid: 'A00000000',
        name: 'white_check_mark',
        channel: 'C00000000',
        timestamp: 1234567890,
      }
      const res = slack.reaction(data)
      await expect(res).resolves.toBeDefined()
    })
  })

  describe('getUser()', () => {
    test('valid', async () => {
      const data = {
        appid: 'A00000000',
        id: 'U00000000',
      }
      const res = slack.getUser(data)
      await expect(res).resolves.toBeDefined()
    })
  })

  describe('getChannel()', () => {
    test('valid', async () => {
      const data = {
        appid: 'A00000000',
        id: 'C00000000',
      }
      const res = slack.getChannel(data)
      await expect(res).resolves.toBeDefined()
    })
  })

  describe('getChannels()', () => {
    const data = {
      appid: 'A00000000',
    }
    test('ok', async () => {
      const res = slack.getChannels(data)
      await expect(res).resolves.toBeDefined()
    })
  })
})

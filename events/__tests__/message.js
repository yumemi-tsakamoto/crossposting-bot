'use strict'

const uniqid = require('uniqid')
const { event } = require('../../handler')
const slack = require('../../adapters/slack')
const dynamodb = require('../../adapters/dynamodb')
const Message = require('../../models/message')
const pkg = require('../../package.json')

jest.mock('aws-sdk')
jest.mock('@slack/client')
jest.mock('../../adapters/cloudwatch')
const slackBot = jest.spyOn(slack, 'bot')
const slackPost = jest.spyOn(slack, 'postMessage')
let botCalls = 0
let postCalls = 0

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

describe('events/message', () => {
  describe('BOTのDMに投稿すると message イベントが届く', () => {
    test('BOTのバージョンを表示', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-ver',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', pkg.version)
      expect(payload).toHaveProperty('attachments', [])
    })

    test('ヘルプを表示', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-help',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.help)
      expect(payload).toHaveProperty('attachments', [])
    })

    test('先頭に-があるとコマンドとなる - 利用できないコマンドはエラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'command_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.command_not_found)
    })

    test('チャンネル未登録でメッセージを送るとアラートが表示される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'post_not_channel')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.post_not_channel)
      expect(payload).toHaveProperty('attachments', [])
    })

    test('チャンネル一覧を表示 - まだ0件の為アラートが表示される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-list',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_list_none)
      expect(payload).toHaveProperty('attachments', [])
    })

    test('チャンネルをチャンネル名で追加 - #generalは存在する為成功する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-add #general',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_add_success)
      expect(payload).toHaveProperty('attachments', [{ text: '#general' }])
    })

    test('メッセージを投稿 - 登録されている#generalチャンネルだけに投稿される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackPost).toHaveBeenCalled()
      const payload = slackPost.mock.calls[postCalls++][0]
      expect(payload).toHaveProperty('text', 'Hello')
      expect(payload).toHaveProperty('username', 'testuser')
      expect(payload).toHaveProperty('channels', ['C00000000'])
    })

    test('チャンネルをIDで追加 - C00000001 = #randomは存在する為成功する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-add C00000001',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_add_success)
      expect(payload).toHaveProperty('attachments', [{ text: '#random' }])
    })
    test('メッセージを投稿 - 登録されている#generalと#randomチャンネルにも投稿される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackPost).toHaveBeenCalled()
      const payload = slackPost.mock.calls[postCalls++][0]
      expect(payload).toHaveProperty('text', 'Hello')
      expect(payload).toHaveProperty('username', 'testuser')
      expect(payload).toHaveProperty('channels', ['C00000000', 'C00000001'])
    })

    test('チャンネルをリンクで追加 - #randomは重複する為エラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-add <#C00000001|random>',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_duplicate)
      expect(payload).toHaveProperty('attachments', [{ text: '#random' }])
    })

    test('チャンネルをIDで追加 - C00000099は存在しない為エラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-add C00000099',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'channel_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_not_found)
      expect(payload).toHaveProperty('attachments', [{ text: 'C00000099' }])
    })

    test('チャンネルを名前で追加 - #exampleは存在しない為エラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-add #example',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'channel_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_not_found)
      expect(payload).toHaveProperty('attachments', [{ text: '#example' }])
    })

    test('チャンネル一覧を表示 - 登録されている#generalと#randomの2チャンネルが表示される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-list',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_list)
      expect(payload).toHaveProperty('attachments', [
        { text: '#general' },
        { text: '#random' },
      ])
    })

    test('チャンネルをリンクで削除 - #generalは登録されている為成功する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-del <#C00000000|general>',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_del_success)
      expect(payload).toHaveProperty('attachments', [{ text: '#general' }])
    })

    test('チャンネルを名前で削除 - #generalは既に削除済みの為エラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-del #general',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'channel_not_list')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_not_list)
      expect(payload).toHaveProperty('attachments', [{ text: '#general' }])
    })

    test('チャンネルをIDで削除 - C00000099は存在しない為エラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-del C00000099',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'channel_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_not_found)
      expect(payload).toHaveProperty('attachments', [{ text: 'C00000099' }])
    })

    test('チャンネルを名前で削除 - #exampleは存在しない為エラーが返る', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-del #example',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'channel_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_not_found)
      expect(payload).toHaveProperty('attachments', [{ text: '#example' }])
    })

    test('チャンネル一覧を表示 - 削除されていない#randomチャンネルだけが表示される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-list',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_list)
      expect(payload).toHaveProperty('attachments', [{ text: '#random' }])
    })

    test('メッセージを投稿 - 削除されていない#randomチャンネルだけに投稿される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackPost).toHaveBeenCalled()
      const payload = slackPost.mock.calls[postCalls++][0]
      expect(payload).toHaveProperty('text', 'Hello')
      expect(payload).toHaveProperty('username', 'testuser')
      expect(payload).toHaveProperty('channels', ['C00000001'])
    })

    test('チャンネルを名前で削除 - #randomは登録されている為成功する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-del #random',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_del_success)
      expect(payload).toHaveProperty('attachments', [{ text: '#random' }])
    })

    test('list channels = 0', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-list',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_list_none)
      expect(payload).toHaveProperty('attachments', [])
    })

    test('チャンネル一覧を表示 - 登録は0件になった為アラートが表示される', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'post_not_channel')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.post_not_channel)
      expect(payload).toHaveProperty('attachments', [])
    })
  })

  describe('ユーザーが見つからない場合', () => {
    test('チャンネルの追加は失敗する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000099',
        text: '-add #general',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'user_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.user_not_found)
    })

    test('チャンネルの削除は失敗する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000099',
        text: '-del #general',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'user_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.user_not_found)
    })

    test('チャンネルの一覧は失敗する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000099',
        text: '-list',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'user_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.user_not_found)
    })

    test('メッセージの投稿は失敗する', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000099',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'user_not_found')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.user_not_found)
    })
  })

  describe('チャンネルが見つからない場合', () => {
    beforeAll(async () => {
      // Add unknown channels
      const user = await dynamodb.get({
        TableName: dynamodb.table.USER,
        Item: { id: 'U00000000' },
      })
      user.channels.push('C00000098')
      user.channels.push('C00000099')
      await dynamodb.put({
        TableName: dynamodb.table.USER,
        Item: user,
      })

      const ch = await dynamodb.get({
        TableName: dynamodb.table.CHANNEL,
        Item: { id: 'C00000000' },
      })
      ch.id = 'C00000098'
      ch.name = 'unknown-channel'
      await dynamodb.put({
        TableName: dynamodb.table.CHANNEL,
        Item: ch,
      })
    })

    test('不明なチャンネルを一覧表示してもIDでの表示となる', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: '-list',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'ok')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.channel_list)
      expect(payload).toHaveProperty('attachments', [
        { text: '#unknown-channel' },
        { text: 'C00000099' },
      ])
    })

    test('不明なチャンネルが転送チャンネルに含まれていたら、不明なチャンネルだけ配信されず、エラーを返す', async () => {
      const data = {
        type: 'message',
        channel: 'D00000000',
        user: 'U00000000',
        text: 'Hello',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'error')

      expect(slackBot).toHaveBeenCalled()
      const payload = slackBot.mock.calls[botCalls++][0]
      expect(payload).toHaveProperty('text', Message.post_error)
      expect(payload).toHaveProperty('attachments', [
        { text: '#unknown-channel' },
        { text: 'C00000099' },
      ])
    })
  })

  describe('無効なメッセージ', () => {
    test('BOTからのメッセージ', async () => {
      const data = {
        subtype: 'bot_message',
        type: 'message',
        channel: 'D00000000',
        user: 'U00000099',
        text: '-add #general',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'bot_message')
    })

    test('パラメータ不足のイベントデータ', async () => {
      const data = {
        type: 'message',
      }
      const res = handler(data)
      await expect(res).resolves.toHaveProperty('body', 'not_enough_params')
    })
  })
})

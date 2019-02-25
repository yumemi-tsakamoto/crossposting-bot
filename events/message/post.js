'use strict'

const slack = require('../../adapters/slack')
const Channel = require('../../models/channel')
const User = require('../../models/user')
const Message = require('../../models/message')
const { error } = require('../../adapters/cloudwatch')

module.exports = async event => {
  // ユーザー取得
  const user = new User(event.appid)
  try {
    await user.load(event.user)
  } catch (e) {
    await slack.bot({
      appid: event.appid,
      channel: event.channel,
      text: Message.user_not_found,
    })
    error(e)
    return { statusCode: 200, body: 'user_not_found' }
  }

  // 転送チャンネルをチェック
  const channels = await user.getChannels()
  if (channels.length === 0) {
    await slack.bot({
      appid: event.appid,
      channel: event.channel,
      text: Message.post_not_channel,
      attachments: [],
    })
    return { statusCode: 200, body: 'post_not_channel' }
  }

  // Slackに投稿
  const userInfo = await user.get()
  const result = await slack.postMessage({
    appid: event.appid,
    username: userInfo.name,
    icon_url: userInfo.icon,
    text: event.text,
    channels,
  })

  // エラーレスポンス
  if (result.errors && result.errors.length > 0) {
    // チャンネル名取得
    const channel = new Channel(event.appid)
    const channels = await Promise.all(
      result.errors.map(async cid => {
        const ch = await channel.loadDbById(cid)
        return { text: ch ? `#${ch.name}` : cid }
      })
    )

    // Slackに投稿
    await slack.bot({
      channel: event.channel,
      text: Message.post_error,
      attachments: channels,
    })
    return { statusCode: 200, body: 'error' }
  }

  // 完了リアクション
  await slack.reaction({
    appid: event.appid,
    name: 'white_check_mark',
    channel: event.channel,
    timestamp: event.timestamp,
  })

  // 正常終了
  return { statusCode: 200, body: 'ok' }
}

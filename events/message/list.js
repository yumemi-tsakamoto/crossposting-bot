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

  // コマンド処理
  let text = ''
  const channels = await user.getChannels()
  if (channels.length > 0) {
    text = Message.channel_list
  } else {
    text = Message.channel_list_none
  }

  // チャンネル名取得
  const channel = new Channel(event.appid)
  const attachments = await Promise.all(
    channels.map(async cid => {
      const ch = await channel.loadDbById(cid)
      if (ch) return { text: `#${ch.name}` }
      return { text: cid }
    })
  )

  // Slackに投稿
  await slack.bot({
    appid: event.appid,
    channel: event.channel,
    text,
    attachments,
  })

  // 正常終了
  return { statusCode: 200, body: 'ok' }
}

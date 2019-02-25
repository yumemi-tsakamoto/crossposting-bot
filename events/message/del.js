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

  // チャンネル取得
  const channel = new Channel(event.appid)
  try {
    await channel.load(event.text)
  } catch (e) {
    error(e)
    await slack.bot({
      appid: event.appid,
      channel: event.channel,
      text: Message.channel_not_found,
      attachments: [{ text: event.text }],
    })
    return { statusCode: 200, body: 'channel_not_found' }
  }
  const ch = await channel.get()

  // コマンド処理
  let text = ''
  let body = 'ok'
  const attachments = []
  try {
    await user.delChannel(ch.id)
    text = Message.channel_del_success
    attachments.push({ text: `#${ch.name}` })
  } catch (e) {
    /* istanbul ignore else / outer error */
    if (e.message === 'channel_not_list') {
      body = 'channel_not_list'
      text = Message.channel_not_list
      attachments.push({ text: `#${ch.name}` })
    } else {
      body = 'channel_del_error'
      text = Message.channel_del_error
    }
  }

  // Slackに投稿
  await slack.bot({
    appid: event.appid,
    channel: event.channel,
    text,
    attachments,
  })

  // 正常終了
  return { statusCode: 200, body }
}

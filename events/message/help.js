'use strict'

const slack = require('../../adapters/slack')
const Message = require('../../models/message')

module.exports = async event => {
  // コマンド処理
  const text = Message.help
  const attachments = []

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

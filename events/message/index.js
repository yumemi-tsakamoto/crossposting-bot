'use strict'

const _get = require('lodash.get')

const slack = require('../../adapters/slack')
const Message = require('../../models/message')

const Post = require('./post')
const Add = require('./add')
const Del = require('./del')
const List = require('./list')
const Help = require('./help')
const Ver = require('./ver')

module.exports = async body => {
  // bot自身の発言に対しては何もしない
  if (_get(body, 'event.subtype') === 'bot_message') {
    return { statusCode: 200, body: 'bot_message' }
  }

  // パラメータチェック
  const event = {
    appid: _get(body, 'api_app_id'),
    user: _get(body, 'event.user'),
    text: _get(body, 'event.text'),
    channel: _get(body, 'event.channel'),
    timestamp: _get(body, 'event.event_ts'),
    command: null,
  }

  if (!event.appid || !event.user || !event.text || !event.channel) {
    return { statusCode: 200, body: 'not_enough_params' }
  }

  // コマンドを判別
  const command = event.text.match(/^-(\S+)\s*(\S*)\s*$/)
  if (command) {
    event.command = command[1]
    event.text = command[2]
  }

  // コマンド処理
  if (event.command !== null) {
    switch (event.command) {
      case 'add': {
        return Add(event)
      }
      case 'del': {
        return Del(event)
      }
      case 'list': {
        return List(event)
      }
      case 'help': {
        return Help(event)
      }
      case 'ver': {
        return Ver(event)
      }
      default: {
        await slack.bot({
          appid: event.appid,
          channel: event.channel,
          text: Message.command_not_found,
          attachments: [{ text: event.command }],
        })
        return { statusCode: 200, body: 'command_not_found' }
      }
    }

    // メッセージのみは転送処理
  } else {
    return Post(event)
  }
}

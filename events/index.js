'use strict'

const _get = require('lodash.get')
const { log } = require('../adapters/cloudwatch')

const message = require('./message')
const channelRename = require('./channelRename')
const userChange = require('./userChange')
const urlVerification = require('./urlVerification')

let events = []

module.exports = async payload => {
  log('REQUEST', payload.body)

  // リクエストをパース
  let body = null
  try {
    body = JSON.parse(payload.body)
  } catch (e) {
    body = {}
    return
  }

  // SlackのURLチェック
  /* istanbul ignore else / no else */
  if (_get(body, 'type') === 'url_verification') {
    return urlVerification(body)
  }

  // イベントIDチェック
  const eventId = _get(body, 'event_id')
  if (events.indexOf(eventId) > -1) {
    return { statusCode: 200, body: 'duplicate_event' }
  } else {
    events.push(eventId)
    if (events.length > 10) {
      events.shift()
    }
  }

  // イベント判別
  const event = _get(body, 'event.type')
  switch (event) {
    case 'message': {
      return message(body)
    }
    case 'user_change': {
      return userChange(body)
    }
    case 'channel_rename': {
      return channelRename(body)
    }
    default: {
      return { statusCode: 200, body: 'unknown_event' }
    }
  }
}

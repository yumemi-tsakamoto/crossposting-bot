'use strict'

const _get = require('lodash.get')

const Channel = require('../models/channel')
const { error } = require('../adapters/cloudwatch')

module.exports = async body => {
  // パラメータチェック
  const event = {}
  event.appid = _get(body, 'api_app_id')
  event.channel = _get(body, 'event.channel')
  if (!event.appid || !event.channel) {
    return { statusCode: 200, body: 'not_enough_params' }
  }

  // チャンネル保存
  const channel = new Channel(event.appid)
  try {
    await channel.set(event.channel)
    await channel.save()
  } catch (e) /* istanbul ignore next / outer error */ {
    error(e)
    return { statusCode: 200, body: 'update_failed' }
  }
  return { statusCode: 200, body: 'updated' }
}

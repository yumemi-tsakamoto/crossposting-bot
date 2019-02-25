'use strict'

const _get = require('lodash.get')

const User = require('../models/user')
const { error } = require('../adapters/cloudwatch')

module.exports = async body => {
  // パラメータチェック
  const event = {}
  event.appid = _get(body, 'api_app_id')
  event.user = _get(body, 'event.user')
  if (!event.appid || !event.user) {
    return { statusCode: 200, body: 'not_enough_params' }
  }

  // ユーザー取得
  const user = new User(event.appid)
  try {
    await user.load(event.user.id)
  } catch (e) {
    error(e)
  }

  // チャンネル保存
  try {
    await user.set(event.user)
    await user.save()
  } catch (e) /* istanbul ignore next / outer error */ {
    error(e)
    return { statusCode: 200, body: 'update_failed' }
  }
  return { statusCode: 200, body: 'updated' }
}

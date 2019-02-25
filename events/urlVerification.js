'use strict'

const _get = require('lodash.get')

module.exports = async body => {
  // challenge文字抽出
  const challenge = _get(body, 'challenge')
  // 正常終了
  return { statusCode: 200, body: challenge }
}

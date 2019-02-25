'use strict'

const _get = require('lodash.get')
const _find = require('lodash.find')
const slack = require('../adapters/slack')
const dynamodb = require('../adapters/dynamodb')

class Channel {
  constructor(appid) {
    this.appid = appid
    this.info = null
  }

  async load(key) {
    // appidチェック
    if (!this.appid) throw new Error('channel_not_found')

    // キーを分解
    const params = this.parse(key)

    let info = null
    // IDからデータを取得
    if (params.id) {
      // データが同じなら終わり
      if (_get(this.info, 'id') === params.id) return

      // DBから取得
      info = await this.loadDbById(params.id)

      // DBになかったらSlackから取得
      if (!info) {
        info = await this.loadSlackById(params.id)
      }

      // Nameからデータを取得
    } else if (params.name) {
      // データが同じなら終わり
      if (_get(this.info, 'name') === params.name) return

      // DBから取得
      info = await this.loadDbByName(params.name)
      // DBになかったらSlackから取得
      if (!info) {
        info = await this.loadSlackByName(params.name)
      }
    }

    if (!info) throw new Error('channel_not_found')
    this.info = info
  }

  parse(text) {
    if (!text) return {}

    const checkId = text.match(/^(C\S{8})/)
    if (checkId) {
      return { id: checkId[1] }
    }

    const checkLink = text.match(/^<#(C\S{8})\|/)
    if (checkLink) {
      return { id: checkLink[1] }
    }

    const checkName = text.match(/^#(\S+)/)
    if (checkName) {
      return { name: checkName[1] }
    }

    return {}
  }

  // DBからIDで情報取得
  async loadDbById(id) {
    return await dynamodb
      .get({
        TableName: dynamodb.table.CHANNEL,
        Key: { id, appid: this.appid },
      })
      .catch(() => null)
  }

  // DBからNameで情報取得
  async loadDbByName(name) {
    const params = {
      TableName: dynamodb.table.CHANNEL,
      IndexName: 'byName',
      KeyConditionExpression: 'name = :hkey and appid = :rkey',
      ExpressionAttributeValues: {
        ':hkey': name,
        ':rkey': this.appid,
      },
    }
    const res = await dynamodb.query(params).catch(() => [null])
    return res[0]
  }

  // SlackからIDで情報取得
  async loadSlackById(id) {
    const res = await slack
      .getChannel({
        appid: this.appid,
        id,
      })
      .catch(() => null)

    // 取得が成功したらDBに保存
    /* istanbul ignore else / no else */
    if (res) {
      const data = {
        appid: this.appid,
        id,
        name: _get(res, 'name'),
        update: Date.now(),
      }
      await dynamodb.put({
        TableName: dynamodb.table.CHANNEL,
        Item: data,
      })
      return data
    }
    return null
  }

  // SlackからNameで情報取得
  async loadSlackByName(name) {
    const res = await slack
      .getChannels({
        appid: this.appid,
      })
      .catch(() => null)
    const ch = _find(res, { name })
    // 取得が成功したらDBに保存
    if (ch) {
      const data = {
        appid: this.appid,
        id: _get(ch, 'id'),
        name,
        update: Date.now(),
      }
      await dynamodb.put({
        TableName: dynamodb.table.CHANNEL,
        Item: data,
      })
      return data
    }
    return null
  }

  async get() {
    return this.info
  }

  async set(data) {
    if (!data.id) throw new Error('required_parameter_missing')
    const info = {
      appid: this.appid,
      id: data.id,
      name: _get(data, 'name'),
      update: Date.now(),
    }
    this.info = info
  }

  async save() {
    /* istanbul ignore else / no else */
    if (this.info) {
      await dynamodb.put({
        TableName: dynamodb.table.CHANNEL,
        Item: this.info,
      })
    }
  }
}

module.exports = Channel

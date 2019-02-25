'use strict'

const _get = require('lodash.get')
const slack = require('../adapters/slack')
const dynamodb = require('../adapters/dynamodb')

class User {
  constructor(appid) {
    this.appid = appid
    this.info = null
  }

  async load(id) {
    // appidチェック
    if (!this.appid) throw new Error('user_not_found')

    let info = null
    // IDからデータを取得
    if (id) {
      // データが同じなら終わり
      if (_get(this.info, 'id') === id) return

      // DBから取得
      info = await this.loadDbById(id)
      // DBになかったらSlackから取得
      if (!info) {
        info = await this.loadSlackById(id)
      }
    }

    if (!info) throw new Error('user_not_found')
    this.info = info
  }

  // DBからIDで情報取得
  async loadDbById(id) {
    return await dynamodb
      .get({
        TableName: dynamodb.table.USER,
        Key: { id, appid: this.appid },
      })
      .catch(() => null)
  }

  // SlackからIDで情報取得
  async loadSlackById(id) {
    const res = await slack
      .getUser({
        appid: this.appid,
        id,
      })
      .catch(() => null)
    // 取得が成功したらDBに保存
    if (res) {
      const data = {
        appid: this.appid,
        id,
        name: _get(res, 'profile.display_name') || _get(res, 'name'),
        icon: _get(res, 'profile.image_48'),
        channels: [],
        update: Date.now(),
      }
      await dynamodb.put({
        TableName: dynamodb.table.USER,
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
      name:
        _get(data, 'profile.display_name') ||
        _get(data, 'real_name') ||
        _get(data, 'name') ||
        _get(this.info, 'name'),
      icon: _get(data, 'profile.image_48') || _get(this.info, 'icon'),
      channels: _get(this.info, 'channels') || [],
      update: Date.now(),
    }
    this.info = info
  }

  async getChannels() {
    return this.info.channels
  }

  async addChannel(cid) {
    if (this.info.channels.indexOf(cid) > -1) {
      throw new Error('channel_duplicate')
    }
    this.info.channels.push(cid)
    await this.save()
  }

  async delChannel(cid) {
    if (this.info.channels.indexOf(cid) === -1) {
      throw new Error('channel_not_list')
    }
    this.info.channels = this.info.channels.filter(c => c !== cid)
    await this.save()
  }

  async save() {
    /* istanbul ignore else / no else */
    if (this.info) {
      await dynamodb.put({
        TableName: dynamodb.table.USER,
        Item: this.info,
      })
    }
  }
}

module.exports = User

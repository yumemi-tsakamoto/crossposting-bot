'use strict'

const low = require('lowdb')
const Memory = require('lowdb/adapters/Memory')
const data = require('./db.json')

const db = low(new Memory())
db.defaults(data).write()

class WebClient {
  constructor(token) {
    this.token = token
    this.chat = {
      postMessage: payload => {
        const item = db
          .get('slack-channels')
          .find({ id: payload.channel })
          .value()
        if (item) {
          return Promise.resolve({
            ok: true,
            channel: payload.channel,
            ts: '1503435956.000247',
            message: {
              text: payload.text,
              username: payload.username,
              bot_id: 'B00000000',
              attachments: payload.attachments,
              type: 'message',
              subtype: 'bot_message',
              ts: '1503435956.000247',
            },
          })
        } else {
          return Promise.resolve({
            ok: false,
            error: 'channel_not_found',
          })
        }
      },
    }
    this.users = {
      info: payload => {
        const item = db
          .get('slack-users')
          .find({ id: payload.user })
          .value()
        if (item) {
          return Promise.resolve({
            ok: true,
            user: item,
          })
        } else {
          return Promise.resolve({
            ok: false,
            error: 'user_not_found',
          })
        }
      },
    }

    this.reactions = {
      add: payload => {
        return Promise.resolve({
          ok: true,
        })
      },
    }

    this.conversations = {
      info: payload => {
        const item = db
          .get('slack-channels')
          .find({ id: payload.channel })
          .value()
        if (item) {
          return Promise.resolve({
            ok: true,
            channel: item,
          })
        } else {
          return Promise.resolve({
            ok: false,
            error: 'channel_not_found',
          })
        }
      },
      list: payload => {
        const items = db.get('slack-channels').value()
        if (items) {
          return Promise.resolve({
            ok: true,
            channels: items,
            response_metadata: {
              next_cursor: 'XXXYYY=',
            },
          })
        } else {
          return Promise.resolve({
            ok: false,
            error: 'channel_not_found',
          })
        }
      },
    }
  }
}

module.exports = { WebClient }

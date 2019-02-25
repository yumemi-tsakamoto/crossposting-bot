'use strict'
const low = require('lowdb')
const Memory = require('lowdb/adapters/Memory')

// const adapter = new FileSync()
const db = low(new Memory())

db.defaults({
  'crosspost-bot-users': [],
  'crosspost-bot-channels': [],
}).write()

// const find = require('lodash.find')

// const data = [
//   {
//     id: 'W00000000',
//     appid: 'A00000000',
//     name: 'testuser',
//     icon: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
//     active: 0,
//     channels: ['C00000000'],
//   },
//   {
//     id: 'W00000010',
//     appid: 'A00000000',
//     name: 'testuser2',
//     icon: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
//     active: 3000000000,
//     channels: ['C00000000', 'C00000001', 'C00000099'],
//   },
//   {
//     id: 'W00000011',
//     appid: 'A00000000',
//     name: 'testuser3',
//     icon: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
//     active: 3000000000,
//     channels: [],
//   },
//   {
//     id: 'W00000000',
//     appid: 'A00000001',
//     name: 'testuserA',
//     icon: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
//     active: 3000000000,
//     channels: ['C00000001'],
//   },
// ]

class DocumentClient {
  constructor(config) {
    this.config = config
    this.result = null
  }

  get(opt) {
    const item = db
      .get(opt.TableName)
      .find(opt.Key)
      .value()

    this.result = { Item: item }
    return this
  }

  put(opt) {
    const test = db
      .get(opt.TableName)
      .find({ id: opt.Item.id })
      .value()
    let item = null
    if (test) {
      item = db
      .get(opt.TableName)
      .find({ id: opt.Item.id })
      .assign(opt.Item)
      .write()
    } else {
      item = db
      .get(opt.TableName)
      .push(opt.Item)
      .write()
    }
    this.result = { err: null, data: { Attributes: item } }
    return this
  }

  query(opt) {
    const item = db
      .get(opt.TableName)
      .find({ name: opt.ExpressionAttributeValues[':hkey'] })
      .value()

    this.result = { Items: [item] }
    return this
  }

  promise() {
    if (this.result) return Promise.resolve(this.result)
    return Promise.reject(new Error('Test Error'))
  }
}

module.exports = {
  DynamoDB: {
    DocumentClient,
  },
}

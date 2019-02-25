'use strict'

const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
})

exports.table = {
  USER: process.env.TABLE_NAME_USER || 'crosspost-bot-users',
  CHANNEL: process.env.TABLE_NAME_CHANNEL || 'crosspost-bot-channels',
}

exports.get = async opt => {
  return await docClient
    .get(opt)
    .promise()
    .then(res => res.Item)
}

exports.query = async opt => {
  return await docClient
    .query(opt)
    .promise()
    .then(res => res.Items)
}

exports.put = async opt => {
  return await docClient.put(opt).promise()
}

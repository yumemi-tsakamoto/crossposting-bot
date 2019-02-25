const dynamodb = require('../dynamodb')

jest.mock('aws-sdk')

describe('adapters/dynamodb', () => {
  describe('put()', () => {
    test('情報を更新', async () => {
      const info = {
        id: 'TEST0000',
        name: 'testuser',
      }
      const res = dynamodb.put({
        TableName: dynamodb.table.USER,
        Item: info,
      })
      await expect(res).resolves.toBeDefined()
    })
  })
  describe('get()', () => {
    test('IDで情報を取得', async () => {
      const res = dynamodb.get({
        TableName: dynamodb.table.USER,
        Key: { id: 'TEST0000' },
      })
      await expect(res).resolves.toHaveProperty('name', 'testuser')
    })
    test('IDで情報を取得 - 見つからない場合はundefinedが返る', async () => {
      const res = dynamodb.get({
        TableName: dynamodb.table.USER,
        Key: { id: 'TEST1111' },
      })
      await expect(res).resolves.toBeUndefined()
    })
  })

  describe('query()', () => {
    test('nameで情報を取得', async () => {
      const res = dynamodb.query({
        TableName: dynamodb.table.USER,
        IndexName: 'byName',
        KeyConditionExpression: 'name = :hkey',
        ExpressionAttributeValues: {
          ':hkey': 'testuser',
        },
      })
      await expect(res).resolves.toHaveProperty('0.id', 'TEST0000')
    })

    test('nameで情報を取得 - 見つからない場合はundefinedが返る', async () => {
      const res = dynamodb.query({
        TableName: dynamodb.table.USER,
        IndexName: 'byName',
        KeyConditionExpression: 'name = :hkey',
        ExpressionAttributeValues: {
          ':hkey': 'hello',
        },
      })
      await expect(res).resolves.toHaveProperty('0', undefined)
    })
  })
})

'use strict'
const { WebClient } = require('@slack/client')
const { debug } = require('./cloudwatch')

const getToken = appid => {
  return process.env[`SLACK_BOT_TOKEN_${appid}`]
}

exports.postMessage = async ({ appid, username, icon_url, text, channels }) => {
  debug({
    api: 'app.chat.postMessage',
    arg: {
      appid,
      username,
      icon_url,
      text,
      channels,
      as_user: false,
    },
  })
  if (!appid || !username || !icon_url || !text || !channels) {
    throw new Error('not_enough_params')
  }
  const client = new WebClient(getToken(appid))
  const ret = { ok: [], errors: [] }
  const posts = channels.map(c => {
    return client.chat
      .postMessage({
        channel: c,
        text,
        username,
        icon_url,
        as_user: false,
      })
      .then(r => {
        /* istanbul ignore else / outer error */
        if (r.ok) {
          ret.ok.push(c)
        } else {
          ret.errors.push(c)
        }
      })
  })

  await Promise.all(posts)
  return ret
}

exports.bot = ({ appid, channel, text, attachments }) => {
  debug({
    api: 'bot.chat.postMessage',
    arg: { appid, channel, text, attachments },
  })
  const client = new WebClient(getToken(appid))
  return client.chat.postMessage({
    channel,
    text,
    attachments,
  })
}

exports.reaction = ({ appid, name, channel, timestamp }) => {
  debug({
    api: 'reactions.add',
    arg: { name, channel, timestamp },
  })
  const client = new WebClient(getToken(appid))
  return client.reactions.add({
    name,
    channel,
    timestamp,
  })
}

exports.getUser = ({ appid, id }) => {
  debug({ api: 'users.info', arg: { appid, id } })
  const client = new WebClient(getToken(appid))
  return client.users.info({ user: id }).then(res => {
    /* istanbul ignore next / outer error */
    if (!res.ok) throw new Error(res.error)
    return res.user
  })
}

exports.getChannel = ({ appid, id }) => {
  debug({ api: 'conversations.info', arg: { appid, id } })
  const client = new WebClient(getToken(appid))
  return client.conversations.info({ channel: id }).then(res => {
    /* istanbul ignore next / outer error */
    if (!res.ok) throw new Error(res.error)
    return res.channel
  })
}

exports.getChannels = async ({ appid }) => {
  debug({
    api: 'conversations.list',
    arg: { appid, types: 'public_channel,private_channel', limit: 100 },
  })
  const client = new WebClient(getToken(appid))
  return client.conversations
    .list({
      types: 'public_channel,private_channel',
      limit: 1000,
    })
    .then(res => {
      /* istanbul ignore next / outer error */
      if (!res.ok) throw new Error(res.error)
      return res.channels
    })
}

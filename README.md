# Crossposting Bot

Crossposting bot for Slack

## Usage

下のコマンドで転送チャンネル先を登録すると、
DMチャネルに投稿した内容が転送チャンネルにも同時投稿されます

### Commands

`-add #\<channel-name>`

転送先のチャンネルを追加します

`-del #\<channel-name>`

転送先のチャンネルを追加します

`-list`

登録済みの転送チャンネルの一覧を表示します

`-help`

ヘルプを表示します。

`-ver`

Botのバージョンを表示します。


## Install

First, install the Serverless Framework and configure your AWS credentials:

```
$ npm install serverless -g
$ serverless config credentials --provider aws --key XXX --secret YYY
```

Install dependencies

```
$ cd crossposting-bot
$ npm install
```

Change Settings

```
$ vi env.yml
```

Development Deploy

```
$ vi npm run deploy
```

Production Deploy

```
$ vi npm run deploy:prod
```

## Setup Slack

- Make Slack App
- Add Bot Users
  - Input names
  - Save Changes
- Add Event Subscriptions
  - Set API endpoints to Request URL
  - Subscribe to Workspace Events
    - channel_rename
    - user_change
  - Subscribe to Bot Events
    - message.im
  - Save Changes
- Add OAuth & Permissions
  - Add scope
    - channels:read
    - groups:read
    - users:read
    - chat:write:bot
    - bot
  - Save Changes
  - Install App to Workspace


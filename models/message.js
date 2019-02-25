module.exports = {
  help: `下のコマンドで転送チャンネル先を登録すると、DMチャネルに投稿した内容が登録済みの全ての転送チャンネルに同時投稿されます
  ※現在テスト中ですので、登録がクリアされたらごめんなさい！

  ■Commands
  コマンドは \`-\` のあとに続けて入力をしてください\n
  \`-add #<channel-name>\`
  転送先のチャンネルを登録します\n
  \`-del #<channel-name>\`
  転送先のチャンネルを削除します\n
  \`-list\`
  登録済みの転送チャンネルの一覧を表示します\n
  \`-help\`
  ヘルプを表示します\n
  \`-ver\`
  ボットのバージョンを表示します。`,
  channel_not_found:
    'チャンネルが見つかりません\nプライベートチャンネルを登録する場合はボットをメンバーに加えてから登録してください',
  channel_duplicate: 'このチャンネルは既に登録済みです',
  channel_add_error: 'チャンネルの登録に失敗しました',
  channel_add_success: 'チャンネルを登録しました',
  channel_not_list: 'このチャンネルは登録されておりません',
  channel_del_error: 'チャンネルの削除に失敗しました',
  channel_del_success: 'チャンネルを削除しました',
  channel_list: '登録チャンネル一覧です',
  channel_list_none: '登録チャンネルはありません',
  command_not_found: 'そのコマンドは使えません',
  post_not_channel:
    '転送先のチャンネルが登録されていません\n詳しくは `-help` と入力してください',
  post_error: 'チャンネルへの投稿に失敗しました',
}

exports.log = (type, msg) => {
  console.log(`[${type}]`, msg)
}

exports.error = e => {
  console.error(e)
}

exports.debug = msg => {
  console.log('[DEBUG]', msg)
}

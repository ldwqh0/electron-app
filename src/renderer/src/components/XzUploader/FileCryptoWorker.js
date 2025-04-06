// eslint-disable-next-line no-undef
importScripts('./crypto-js.min.js')
const BATCH_SIZE = 1024 * 1024 * 10

function continueHash (file, hasher, start, resolve) {
  const end = Math.min(start + BATCH_SIZE, file.size)
  if (start < file.size) {
    file.slice(start, end).arrayBuffer().then(buffer => {
      // eslint-disable-next-line no-undef
      hasher.update(CryptoJS.lib.WordArray.create(buffer))
      self.postMessage({
        completed: false,
        progress: end
      })
      continueHash(file, hasher, end, resolve)
    })
  } else {
    resolve({
      completed: true,
      progress: end,
      // eslint-disable-next-line no-undef
      result: hasher.finalize().toString(CryptoJS.enc.Hex)
    })
  }
}

self.addEventListener('message', event => {
  let hasher = null
  switch (event.data.alog) {
    case 'md5':
      // eslint-disable-next-line no-undef
      hasher = CryptoJS.algo.MD5.create()
      break
    case 'sha256':
      // eslint-disable-next-line no-undef
      hasher = CryptoJS.algo.SHA256.create()
      break
    default:
  }

  new Promise((resolve, reject) => {
    continueHash(event.data.file, hasher, 0, resolve, event.data.alog)
  }).then((v) => {
    self.postMessage(v)
  })
})

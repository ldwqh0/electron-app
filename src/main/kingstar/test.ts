import request from './request'

// request({
//   clientId: '333940',
//   outerInstanceId: '492475033566973952',
//   accountId: '1767475183299280404',
//   clientSecret: 'c0ceb5ab5e23232c700edc3ab21d22c4'
// }, {
//   method: 'GET',
//   url: 'https://api.kingdee.com/jdy/v2/fi/voucher'
// }).then((data) => {
//   console.log(data)
// })

// 2397162609297179648

request({
  clientId: '333940',
  outerInstanceId: '492475033566973952',
  accountId: '1767475183299280404',
  clientSecret: 'c0ceb5ab5e23232c700edc3ab21d22c4'
}, {
  method: 'GET',
  url: 'https://api.kingdee.com/jdy/v2/fi/voucher_detail?id=2397162609297179648'
}).then((data) => {
  console.log(data)
})

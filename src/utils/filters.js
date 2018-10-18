import Vue from 'vue'
import moment from 'moment/moment'

Vue.filter('truncate', function (text, stop, clamp) {
  return text.slice(0, stop) + (stop < text.length ? clamp || '...' : '')
})

Vue.filter('formatDate', function (value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY hh:mm')
  }
})

Vue.filter('getFormattedSize', function (bytes, decimals) {
  if (bytes === 0) {
    return '0 Byte'
  }
  let k = 1024
  let dm = decimals <= 0 ? 0 : decimals || 2
  let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
})
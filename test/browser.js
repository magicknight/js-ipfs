'use strict'

const isWebWorker = require('detect-webworker')

if (isWebWorker) {
  // https://github.com/Joris-van-der-Wel/karma-mocha-webworker/issues/4
  global.MFS_DISABLE_CONCURRENCY = true
}

/* eslint-env mocha */
'use strict'

const fs = require('fs')
const spawn = require('../utils/on-and-off')
const parallel = require('async/parallel')

describe('cli', () => {
  let daemonOff
  let daemonOn
  let ipfsd
  before(function (done) {
    // CI takes longer to instantiate the daemon,
    // so we need to increase the timeout for the
    // before step
    this.timeout(60 * 1000)
    parallel([
      (cb) => spawn.daemonOff((isNew, ipfs) => {
        daemonOff = ipfs
        cb()
      }),
      (cb) => spawn.daemonOn((isNew, ipfs, node) => {
        daemonOn = ipfs
        ipfsd = node
        cb()
      })
    ], done)
  })

  after(function (done) {
    this.timeout(20 * 1000)
    spawn.cleanDaemon(daemonOff)
    spawn.stopDaemon(ipfsd, done)
  })

  //require('./id.js')
  fs.readdirSync(__dirname)
    .filter((file) => file !== 'index.js')
    .forEach((file) => require('./' + file))
})

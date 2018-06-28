/* eslint-env mocha */
'use strict'

const hat = require('hat')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const ipfsExec = require('../utils/ipfs-exec')
const clean = require('../utils/clean')
const os = require('os')

const DaemonFactory = require('ipfsd-ctl')
const df = DaemonFactory.create()

let sharedDaemonOff
let sharedDaemonOn

//Spawn with daemon off
function daemonOff (cb) {

  if (sharedDaemonOff) {
    return cb(false, sharedDaemonOff)
  }
  const repoPath = os.tmpdir() + '/ipfs-' + hat()
  sharedDaemonOff = ipfsExec(repoPath)
  sharedDaemonOff.repoPath = repoPath
  sharedDaemonOff('init').then(() => {
    cb(true, sharedDaemonOff)
  })
}

function cleanDaemon (daemon) {
  clean(daemon.repoPath)
  console.log('sharedDaemonOff destroyed')
  sharedDaemonOff = undefined
}

function off (tests) {
  describe('daemon off (directly to core)', () => {
    let thing = {}
    let shouldClean

    before(function (done) {
      this.timeout(60 * 1000)

      daemonOff((isNew, ipfs) => {
        shouldClean = isNew
        thing.ipfs = ipfs
        done()
      })
    })

    after(function (done) {
      if (shouldClean) {
        this.timeout(20 * 1000)
        cleanDaemon(thing.ipfs)
        sharedDaemonOff = undefined
      }
      setImmediate(done)
    })

    tests(thing)
  })
}

function daemonOn (cb) {

  if (sharedDaemonOn) {
    return cb(false, sharedDaemonOn)
  }
  df.spawn({
    type: 'js',
    exec: `./src/cli/bin.js`,
    initOptions: { bits: 512 }
  }, (err, node) => {
    expect(err).to.not.exist()
    const ipfs = ipfsExec(node.repoPath)
    ipfs.repoPath = node.repoPath
    sharedDaemonOn = ipfs
    cb(true, ipfs, node)
  })
}

function stopDaemon (node, cb) {
  node.stop((err) => {
    expect(err).to.not.exist()
    sharedDaemonOn = undefined
    cb()
  })
}

function on (tests) {
  describe('daemon on (through http-api)', () => {
    let thing = {}
    let shouldClean
    let ipfsd

    before(function (done) {
      // CI takes longer to instantiate the daemon,
      // so we need to increase the timeout for the
      // before step
      this.timeout(60 * 1000)
      daemonOn((isNew, ipfs, node) => {
        shouldClean = isNew
        thing.ipfs = ipfs
        ipfsd = node
        done()
      })
    })

    after(function (done) {
      if (!shouldClean) {
        setImmediate(done)
        return
      }
      this.timeout(15 * 1000)
      stopDaemon(ipfsd, done)
    })

    tests(thing)
  })
}

/*
 * CLI Utility to run the tests offline (daemon off) and online (daemon on)
 */
exports = module.exports = (tests) => {
  off(tests)
  on(tests)
}

exports.daemonOn = daemonOn
exports.daemonOff = daemonOff
exports.stopDaemon = stopDaemon
exports.cleanDaemon = cleanDaemon
exports.off = off
exports.on = on

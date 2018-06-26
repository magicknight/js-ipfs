/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const parallel = require('async/parallel')
const waterfall = require('async/waterfall')
const DaemonFactory = require('ipfsd-ctl')
const df = DaemonFactory.create()
const ipfsExec = require('../utils/ipfs-exec')
const clean = require('../utils/clean')

describe('bitswap', () => {
  let ipfsA
  let ipfsB
  let ipfsdA
  let ipfsdB
  let ipfsBId
  const key = 'QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNR'

  before(function (done) {
    this.timeout(60 * 1000)
    parallel([
      (cb) => df.spawn({
          type: 'js',
          exec: `./src/cli/bin.js`,
          initOptions: { bits: 512 }
        }, (err, node) => {
          expect(err).to.not.exist()
          ipfsdA = node
          ipfsA = ipfsExec(node.repoPath)
          ipfsA.repoPath = node.repoPath
          cb()
        }),
      (cb) => waterfall([
        (wcb) => df.spawn({
          type: 'js',
          exec: `./src/cli/bin.js`,
          initOptions: { bits: 512 }
        }, (wcb)),
        (node, wcb) => {
          ipfsdB = node
          ipfsB = ipfsExec(node.repoPath)
          ipfsB.repoPath = node.repoPath
          ipfsB('id').then((res) => {
            ipfsBId = JSON.parse(res)
            wcb()
          })
        }
      ], cb)
    ], (err) => {
      expect(err).to.not.exist()
      ipfsB('block get ' + key)
        .then(() => {})
        .catch(() => {})
      ipfsA('swarm connect ' + ipfsBId.addresses[0]).then((out) => {
        done()
      })
    })
  })

  after(function (done) {
    this.timeout(20 * 1000)
    clean(ipfsA.repoPath)
    clean(ipfsB.repoPath)
    setImmediate(done)
  })

  it('wantlist', function () {
    this.timeout(20 * 1000)
    return ipfsB('bitswap wantlist').then((out) => {
      expect(out).to.eql(key + '\n')
    })
  })

  it('wantlist peerid', function () {
    this.timeout(20 * 1000)
    return ipfsA('bitswap wantlist ' + ipfsBId.id).then((out) => {
      expect(out).to.eql(key + '\n')
    })
  })

  it('stat', function () {
    this.timeout(20 * 1000)

    return ipfsB('bitswap stat').then((out) => {
      expect(out).to.be.eql([
        'bitswap status',
        '  blocks received: 0',
        '  dup blocks received: 0',
        '  dup data received: 0B',
        '  wantlist [1 keys]',
        `    ${key}`,
        '  partners [0]',
        '    '
      ].join('\n') + '\n')
    })
  })

  it('unwant', function () {
    return ipfsB('bitswap unwant ' + key).then((out) => {
      expect(out).to.eql(`Key ${key} removed from wantlist\n`)
    })
  })

  it('ledger', function () {
    return ipfsA('bitswap ledger ' + ipfsBId.id).then((out) => {
      expect(out).to.eql('')
    })
  })
})

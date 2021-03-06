/* eslint-env mocha */

'use strict'

const isNode = require('detect-node')

describe('interface-ipfs-core tests', () => {
  require('./block')
  require('./bootstrap')
  require('./config')
  require('./files')
  require('./generic')
  require('./object')
  require('./dag')
  require('./stats')
  require('./key')
  if (isNode) {
    require('./bitswap')
    require('./swarm')
    require('./ping')
    require('./pubsub')
    require('./dht')
  }
})

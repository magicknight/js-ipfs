'use strict'

const TCP = require('libp2p-tcp')
const MulticastDNS = require('libp2p-mdns')
const WS = require('libp2p-websockets')
const WebSocketStar = require('libp2p-websocket-star')
const Bootstrap = require('libp2p-railing')
const KadDHT = require('libp2p-kad-dht')
const Multiplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const libp2p = require('libp2p')
const defaultsDeep = require('lodash.defaultsdeep')

class Node extends libp2p {
  constructor (_options) {
    const wsstar = new WebSocketStar({id: _options.peerInfo.id})
    const mdns = new MulticastDNS(_options.peerInfo, 'ipfs.local')

    const defaults = {
      modules: {
        transport: [
          TCP,
          WS
        ],
        streamMuxer: [
          Multiplex
        ],
        connEncryption: [
          SECIO
        ],
        peerDiscovery: [
          MulticastDNS,
          Bootstrap
        ],
        peerRouting: [],
        contentRouting: [],
        dht: KadDHT
      },
      config: {
        peerDiscovery: {
          bootstrap: {
            list: _options.bootstrapList
          }
        },
        peerRouting: {},
        contentRouting: {},
        dht: {
          kBucketSize: 20
        }
      },
      EXPERIMENTAL: {
        dht: false,
        pubsub: false
      }
    }

    defaultsDeep(_options, defaults)

    _options.modules.transport.push(wsstar)
    _options.modules.peerDiscovery.push(wsstar)
    _options.modules.peerDiscovery.push(mdns)

    super(_options)
  }
}

module.exports = Node

'use strict'

const OFFLINE_ERROR = require('../utils').OFFLINE_ERROR
const promisify = require('promisify-es6')
const setImmediate = require('async/setImmediate')
const Big = require('big.js')
const CID = require('cids')
const PeerId = require('peer-id')

function formatWantlist (list) {
  return Array.from(list).map((e) => ({ '/': e[1].cid.toBaseEncodedString() }))
}

module.exports = function bitswap (self) {
  return {
    wantlist: promisify((peerId, callback) => {
      if (!callback) {
        callback = peerId
        peerId = undefined
      }

      if (!self.isOnline()) {
        return setImmediate(() => callback(new Error(OFFLINE_ERROR)))
      }

      let list
      if (peerId) {
        try {
          peerId = PeerId.createFromB58String(peerId)
        } catch (e) {
          peerId = null
        }
        if (!peerId) {
          return setImmediate(() => callback(new Error('Invalid peerId')))
        }
        list = self._bitswap.wantlistForPeer(peerId)
      } else {
        list = self._bitswap.getWantlist()
      }
      list = formatWantlist(list)
      return setImmediate(() => callback(null, { Keys: list }))
    }),

    stat: promisify((callback) => {
      if (!self.isOnline()) {
        return setImmediate(() => callback(new Error(OFFLINE_ERROR)))
      }

      const snapshot = self._bitswap.stat().snapshot

      callback(null, {
        provideBufLen: parseInt(snapshot.providesBufferLength.toString()),
        blocksReceived: new Big(snapshot.blocksReceived),
        wantlist: formatWantlist(self._bitswap.getWantlist()),
        peers: self._bitswap.peers().map((id) => id.toB58String()),
        dupBlksReceived: new Big(snapshot.dupBlksReceived),
        dupDataReceived: new Big(snapshot.dupDataReceived),
        dataReceived: new Big(snapshot.dataReceived),
        blocksSent: new Big(snapshot.blocksSent),
        dataSent: new Big(snapshot.dataSent)
      })
    }),

    unwant: promisify((keys, callback) => {
      if (!self.isOnline()) {
        return setImmediate(() => callback(new Error(OFFLINE_ERROR)))
      }

      if (!Array.isArray(keys)) {
        keys = [keys]
      }
      keys = keys.map((key) => {
        if (CID.isCID(key)) {
          return key
        }
        return new CID(key)
      })
      return setImmediate(() => callback(null, self._bitswap.unwant(keys)))
    }),

    ledger: promisify((peerId, callback) => {
      if (!self.isOnline()) {
        return setImmediate(() => callback(new Error(OFFLINE_ERROR)))
      }
      peerId = PeerId.createFromB58String(peerId)

      const ledger = self._bitswap.ledgerForPeer(peerId)
      if (!ledger) {
        return callback(null, null)
      }

      // It's a little clunky having to reinstantiate this peer every time, ipfs-bitswap should just use toString
      peerId = PeerId.createFromB58String(ledger.peer)
      callback(null, {
        Peer: peerId.toPrint(),
        Value: new Big(ledger.value),
        Sent: new Big(ledger.sent),
        Recv: new Big(ledger.recv),
        Exchanged: new Big(ledger.exchanged)
      })
    })
  }
}

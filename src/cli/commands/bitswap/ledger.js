'use strict'

const print = require('../../utils').print

module.exports = {
  command: 'ledger <peer>',

  describe: 'Return bitswap ledger for given peer',

  builder: {
    peer: {
      alias: 'p',
      describe: 'Specify which peer to show ledger for.',
      type: 'string'
    }
  },

  handler (argv) {
    argv.ipfs.bitswap.ledger(argv.peer, (err, res) => {
      if (err) {
        throw err
      }
      if (res) {
        print(`ledger
  Peer: ${res.Peer}
  Value: ${res.Value}
  Sent: ${res.Sent}B
  Received:${res.Recv}B
  Exchange Count: ${res.Exchanged}`)
        return
      }
      print('Ledger not found')
    })
  }
}

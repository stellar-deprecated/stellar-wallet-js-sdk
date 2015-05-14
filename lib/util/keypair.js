var _ = require('lodash');
var errors = require('../errors');
var nacl = require('tweetnacl');
var Base = require('stellar-lib/src/js/ripple/base').Base;
var Seed = require('stellar-lib/src/js/ripple/seed').Seed;
var UInt256 = require('stellar-lib/src/js/ripple/uint256').UInt256;

function generateKeyPair(seed) {
  if(seed){
    seed = new Seed().parse_json(seed);
  } else {
    seed = new Seed().random();
  }
  var keyPair = seed.get_key();
  var address = keyPair.get_address();

  var pubKeyBits = keyPair._pub_bits();
  var newAddressBits = UInt256.from_bits(pubKeyBits);
  var newAddress = Base.encode_check(Base.VER_ACCOUNT_ID, newAddressBits.to_bytes());

  var publicKey = nacl.util.encodeBase64(keyPair._pubkey);
  var secretKey = nacl.util.encodeBase64(keyPair._secret);

  return {
    newAddress: newAddress,
    address: address.to_json(),
    secret: seed.to_json(),
    secretKey: secretKey,
    publicKey: publicKey
  };
}

module.exports = {
  generateKeyPair: generateKeyPair
};

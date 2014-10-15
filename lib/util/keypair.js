var _ = require('lodash');
var errors = require('../errors');
var nacl = require('tweetnacl');
var ripemd160Lib = require('ripemd160');
var sjcl = require('./sjcl');
var UInt160 = require('stellar-lib/src/js/ripple/uint160').UInt160;

var VER_ACCOUNT_ID = 0;

function ripemd160(bits) {
  var buffer = new Buffer(sjcl.codec.hex.fromBits(bits), 'hex');
  var result = ripemd160Lib(buffer);
  return sjcl.codec.hex.toBits(result.toString('hex'));
}

function SHA256_RIPEMD160(bits) {
  return ripemd160(sjcl.hash.sha256.hash(bits));
}

function getAddress(publicKey) {
  var bits = sjcl.codec.bytes.toBits(publicKey);
  var hash = SHA256_RIPEMD160(bits);
  var address = UInt160.from_bits(hash);
  address.set_version(VER_ACCOUNT_ID);
  return address.to_json();
}

function generateKeyPair() {
  var keyPair = nacl.sign.keyPair();
  keyPair.address = getAddress(keyPair.publicKey);
  keyPair.publicKey = nacl.util.encodeBase64(keyPair.publicKey);
  keyPair.secretKey = nacl.util.encodeBase64(keyPair.secretKey);
  return keyPair;
}

module.exports = {
  generateKeyPair: generateKeyPair
};

var _ = require('lodash');
var errors = require('../errors');
var nacl = require('tweetnacl');

function generateKeyPair() {
  var keyPair = nacl.sign.keyPair();
  keyPair.publicKey = nacl.util.encodeBase64(keyPair.publicKey);
  keyPair.secretKey = nacl.util.encodeBase64(keyPair.secretKey);
  return keyPair;
}

module.exports = {
  generateKeyPair: generateKeyPair
};

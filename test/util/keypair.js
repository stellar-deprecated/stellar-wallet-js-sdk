'use strict';

var expect = require('chai').expect;
var keypair = require('../../lib/util/keypair.js');
var nacl = require('tweetnacl');

describe('util/keychain', function () {
  it('should generate a keychain', function (done) {
    var keyPair = keypair.generateKeyPair();
    keyPair.publicKey = nacl.util.decodeBase64(keyPair.publicKey);
    keyPair.secretKey = nacl.util.decodeBase64(keyPair.secretKey);

    var keyPairFromSecret = nacl.sign.keyPair.fromSecretKey(keyPair.secretKey);
    expect(nacl.verify(keyPair.publicKey, keyPairFromSecret.publicKey)).to.be.true;
    done();
  });
});

'use strict';

var expect = require('chai').expect;
var keypair = require('../../lib/util/keypair.js');
var nacl = require('tweetnacl');

describe('util/keypair', function () {
  it('should generate a keypair', function (done) {
    var keyPair = keypair.generateKeyPair();
    keyPair.publicKey = nacl.util.decodeBase64(keyPair.publicKey);
    keyPair.secretKey = nacl.util.decodeBase64(keyPair.secretKey);

    var keyPairFromSecret = nacl.sign.keyPair.fromSecretKey(keyPair.secretKey);
    expect(nacl.verify(keyPair.publicKey, keyPairFromSecret.publicKey)).to.be.true;
    expect(keyPair.address).not.to.be.empty;
    expect(keyPair.address.charAt(0)).to.be.equal('g');
    done();
  });
});

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
    expect(keyPair.newAddress).not.to.be.empty;
    expect(keyPair.newAddress.charAt(0)).to.be.equal('g');
    expect(keyPair.secret.charAt(0)).to.be.equal('s');
    done();
  });

  it('should generate a keypair from seed', function (done) {
    var seed = 's3sYSKfA2xuEWFxdv81YcemGdVgFyZWekRTibbo3pD7BVAisF6Q';
    var keyPair = keypair.generateKeyPair(seed);
    expect(keyPair.secret).to.be.equal(seed);
    keyPair.publicKey = nacl.util.decodeBase64(keyPair.publicKey);
    keyPair.secretKey = nacl.util.decodeBase64(keyPair.secretKey);

    var keyPairFromSecret = nacl.sign.keyPair.fromSecretKey(keyPair.secretKey);
    expect(nacl.verify(keyPair.publicKey, keyPairFromSecret.publicKey)).to.be.true;
    expect(keyPair.address).not.to.be.empty;
    expect(keyPair.newAddress).not.to.be.empty;
    expect(keyPair.newAddress.charAt(0)).to.be.equal('g');
    expect(keyPair.address.charAt(0)).to.be.equal('g');
    done();
  });
});

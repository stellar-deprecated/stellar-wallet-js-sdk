'use strict';

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised")
var errors = require('../../lib/errors');
chai.should();
var nacl = require('tweetnacl');
var validate = require('../../lib/util/validate.js');
var StellarWallet = require('../../index.js');

chai.use(chaiAsPromised);

describe('util/validate', function () {
  it('number', function (done) {
    validate.number('property')({
      property: '0'
    }).should.be.rejectedWith(errors.InvalidField).and.notify(done);
  });

  it('keyPair', function (done) {
    var keyPair = StellarWallet.util.generateKeyPair();
    keyPair.publicKey = nacl.util.decodeBase64(keyPair.publicKey);
    keyPair.publicKey[0] = (++keyPair.publicKey[0]) % 256; // Change first bit
    keyPair.publicKey = nacl.util.encodeBase64(keyPair.publicKey);

    validate.keyPair('keyPair')({
      keyPair: keyPair
    }).should.be.rejectedWith(errors.InvalidField).and.notify(done);
  });
});

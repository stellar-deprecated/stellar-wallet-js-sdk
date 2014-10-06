'use strict';

var expect = require('chai').expect;
var crypto = require('../../lib/util/crypto');
var sjcl = require('../../lib/util/sjcl');

describe('util/crypto', function () {
  it('should correctly encrypt/decrypt data', function (done) {
    var key = sjcl.random.randomWords(8);
    var secret = 'this is secret data';
    var encrypted = crypto.encryptData(secret, key);
    var decrypted = crypto.decryptData(encrypted, key);
    expect(decrypted).to.be.equal(secret);
    done();
  });
});

'use strict';

var expect = require('chai').expect;
var totp = require('../../lib/util/totp');
var base32 = require('thirty-two');

describe('util/totp', function () {
  it('should generate 10 bytes base32 encoded without padding', function (done) {
    var randomKey = totp.generateRandomTotpKey();
    expect(randomKey.slice(-1)).to.not.be.equal('='); // no padding
    var decodedKey = base32.decode(randomKey);
    expect(decodedKey.length).to.be.equal(10);
    done();
  });
});

describe('util/totp', function () {
  it('should generate otpauth uri', function (done) {
    var key = totp.generateRandomTotpKey();
    var expected = 'otpauth://totp/Stellar%20Development%20Foundation:bob@stellar.org?secret='+key+'&issuer=Stellar%20Development%20Foundation';
    var uri = totp.generateTotpUri(key, {
      issuer: 'Stellar Development Foundation',
      accountName: 'bob@stellar.org'
    });
    expect(uri).to.be.equal(expected);
    done();
  });
});

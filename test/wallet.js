'use strict';

var _ = require('lodash');
var base32 = require('thirty-two');
var crypto = require('../lib/util/crypto');
var expect = require('chai').expect;
var nacl = require('tweetnacl');
var notp = require('notp');

describe('stellar-wallet', function () {
  var StellarWallet = require('../index.js');

  var server = 'http://localhost:3000/v2';

  var mainData = {
    key: 'val'
  };

  var keychainData = {
    publicKey: "xxx",
    privateKey: "yyy"
  };

  var username = "joe"+crypto.sha1(Math.random().toString())+"@hostname.org";
  var password = "my_passw0rd";

  var keyPair = nacl.sign.keyPair();
  var privateKey = nacl.util.encodeBase64(keyPair.secretKey);

  var wallet;

  it('should successfully create wallet', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: username,
      password: password,
      privateKey: privateKey,
      mainData: JSON.stringify(mainData),
      keychainData: JSON.stringify(keychainData),
      kdfParams: {
        algorithm: 'scrypt',
        bits: 256,
        n: Math.pow(2,11), // To make tests faster
        r: 8,
        p: 1
      }
    }).then(function(wallet) {
      expect(wallet.getServer()).to.be.equal(server);
      done();
    });
  });

  it('should successfully get wallet', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password,
      privateKey: privateKey
    }).then(function(w) {
      wallet = w;
      var fetchedMainData = JSON.parse(wallet.getMainData());
      var fetchedKeychainData = JSON.parse(wallet.getKeychainData());
      expect(fetchedMainData).not.to.be.empty;
      expect(fetchedMainData).to.be.deep.equal(mainData);
      expect(fetchedKeychainData).not.to.be.empty;
      expect(fetchedKeychainData).to.be.deep.equal(keychainData);
      done();
    });
  });

  it('should successfully setup TOTP for a wallet', function (done) {
    var totpKey = StellarWallet.util.generateRandomTOTPKey();
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    wallet.setupTOTP({
      totpKey: totpKey,
      totpCode: totpCode
    }).then(function() {
      done();
    });
  });
});
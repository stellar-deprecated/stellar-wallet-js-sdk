'use strict';

var _ = require('lodash');
var expect = require('chai').expect;
var nacl = require('tweetnacl');
var sjcl = require('../lib/util/sjcl');

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

  var username = "joe"+Math.random()+"@hostname.org";
  var password = "my_passw0rd";

  var seed = nacl.randomBytes(32);
  var keyPair = nacl.sign.keyPair.fromSeed(seed);
  var publicKeyHex = sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(keyPair.publicKey));

  var wallet;

  it('should successfully create wallet', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: username,
      password: password,
      publicKey: publicKeyHex,
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
      expect(wallet.getServer()).to.be.equal(server);
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should successfully get wallet', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).then(function(w) {
      wallet = w;
      var fetchedMainData = JSON.parse(wallet.getMainData());
      var fetchedKeychainData = JSON.parse(wallet.getKeychainData());
      expect(fetchedMainData).not.to.be.empty;
      expect(fetchedMainData).to.be.deep.equal(mainData);
      expect(fetchedKeychainData).not.to.be.empty;
      expect(fetchedKeychainData).to.be.deep.equal(keychainData);
      done();
    }).catch(function (err) {
      done(err);
    });
  });
});
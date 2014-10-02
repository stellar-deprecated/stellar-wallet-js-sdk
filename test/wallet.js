var _ = require('lodash');
var expect = require('chai').expect;
var nacl = require('tweetnacl');
var sjcl = require('../lib/util/sjcl');

describe('stellar-wallet', function () {
  var StellarWallet = require('../index.js');
  StellarWallet.init({
    server: 'http://localhost:3000/v2'
  });

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

  it('should successfully create wallet', function (done) {
    StellarWallet.createWallet({
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
      expect(wallet).to.deep.equal({status: 'success'});
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should successfully get wallet', function (done) {
    StellarWallet.login({
      username: username,
      password: password
    }).then(function(wallet) {
      wallet = _.mapValues(wallet, JSON.parse);
      expect(wallet.mainData).not.to.be.undefined;
      expect(wallet.mainData).to.be.deep.equal(mainData);
      expect(wallet.keychainData).not.to.be.undefined;
      expect(wallet.keychainData).to.be.deep.equal(keychainData);
      expect(wallet.lockVersion).to.be.equal(0);
      done();
    }).catch(function (err) {
      done(err);
    });
  });
});
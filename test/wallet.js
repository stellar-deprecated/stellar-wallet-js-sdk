'use strict';

var _ = require('lodash');
var base32 = require('thirty-two');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var expect = chai.expect;
chai.should();
var crypto = require('../lib/util/crypto');
var errors = require('../lib/errors');
var nacl = require('tweetnacl');
var notp = require('notp');

chai.use(chaiAsPromised);

describe('stellar-wallet', function () {
  // Timeout increased because most of tests below connect to stellar-wallet
  this.timeout(5000);

  var StellarWallet = require('../index.js');

  var server = 'http://localhost:3000/v2';

  var keyPair = StellarWallet.util.generateKeyPair();
  var newKeyPair = StellarWallet.util.generateKeyPair();

  var mainData = {
    key: 'val'
  };
  var newMainData = 'newMainData';

  var username = "joe"+crypto.sha1(Math.random().toString())+"@hostname.org";
  var password = "my_passw0rd";

  var totpKey = StellarWallet.util.generateRandomTotpKey();

  var wallet;

  it('should throw MissingField error', function (done) {
    StellarWallet.getWallet({
      username: username,
      password: password
    }).should.be.rejectedWith(errors.MissingField).and.notify(done);
  });

  it('should throw WalletNotFound error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).should.be.rejectedWith(errors.WalletNotFound).and.notify(done);
  });

  it('should throw InvalidField error', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: username,
      password: password,
      mainData: mainData // mainData must be stringified
    }).should.be.rejectedWith(errors.InvalidField).and.notify(done);
  });

  it('should successfully create a wallet', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: username,
      password: password,
      keyPair: keyPair,
      mainData: JSON.stringify(mainData),
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

  it('should throw Forbidden error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: 'wrong password'
    }).should.be.rejectedWith(errors.Forbidden).and.notify(done);
  });

  it('should successfully get wallet', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).then(function(w) {
      wallet = w;
      var fetchedMainData = JSON.parse(wallet.getMainData());
      expect(fetchedMainData).not.to.be.empty;
      expect(fetchedMainData).to.be.deep.equal(mainData);

      // Check if message was signed with a keyPair
      var message = 'test message';
      var signature = wallet.signMessage(message);

      message = nacl.util.decodeUTF8(message);
      var expectedSignature = nacl.sign.detached(message, nacl.util.decodeBase64(keyPair.secretKey));
      expectedSignature = nacl.util.encodeBase64(expectedSignature);
      expect(signature).to.be.equal(expectedSignature);

      done();
    });
  });

  it('should return correct username', function (done) {
    expect(wallet.getUsername()).to.be.deep.equal(username);
    done();
  });

  it('should return correct server', function (done) {
    expect(wallet.getServer()).to.be.deep.equal(server);
    done();
  });

  it('should throw InvalidTotpCode error while setupTotp because of invalid TOTP code', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    totpCode = ((parseInt(totpCode[0]) + 1) % 10).toString()+totpCode.substr(1);

    wallet.setupTotp({
      totpKey: totpKey,
      totpCode: totpCode
    }).should.be.rejectedWith(errors.InvalidTotpCode).and.notify(done);
  });

  it('should successfully setup TOTP for a wallet', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    wallet.setupTotp({
      totpKey: totpKey,
      totpCode: totpCode
    }).then(function() {
      done();
    });
  });

  it('should successfully send update wallet request and update wallet object', function (done) {
    wallet.update({
      mainData: newMainData,
      keyPair: newKeyPair
    }).then(function() {
      expect(wallet.getMainData()).not.to.be.empty;
      expect(wallet.getMainData()).to.be.equal(newMainData);

      // Check if message was signed with a newKeyPair
      var message = 'test message';
      var signature = wallet.signMessage(message);

      message = nacl.util.decodeUTF8(message);
      var expectedSignature = nacl.sign.detached(message, nacl.util.decodeBase64(newKeyPair.secretKey));
      expectedSignature = nacl.util.encodeBase64(expectedSignature);
      expect(signature).to.be.equal(expectedSignature);

      done();
    });
  });

  it('should throw TotpCodeRequired error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).should.be.rejectedWith(errors.TotpCodeRequired).and.notify(done);
  });

  it('should throw Forbidden error because of invalid TOTP code', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    totpCode = ((parseInt(totpCode[0]) + 1) % 10).toString()+totpCode.substr(1);

    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password,
      totpCode: totpCode
    }).should.be.rejectedWith(errors.Forbidden).and.notify(done);
  });

  it('should get wallet with TOTP required', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password,
      totpCode: totpCode
    }).then(function(wallet) {
      expect(wallet.getMainData()).not.to.be.empty;
      expect(wallet.getMainData()).to.be.equal(newMainData);
      done();
    });
  });
});
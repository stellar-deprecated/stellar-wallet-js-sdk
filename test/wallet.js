'use strict';

if (typeof window === 'undefined') {
  var base32 = require('thirty-two');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  var nacl = require('tweetnacl');
  var notp = require('notp');
  var StellarWallet = require('../index.js');
}

var expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);

describe('stellar-wallet', function () {
  // Timeout increased because most of tests below connect to stellar-wallet
  this.timeout(5000);

  var server = 'http://localhost:3000/v2';

  var keyPair = StellarWallet.util.generateKeyPair();
  var newKeyPair = StellarWallet.util.generateKeyPair();

  var mainData = {
    key: 'val'
  };
  var newMainData = 'newMainData';

  var username = "joe"+Math.random().toString()+"@hostname.org";
  var password = "my_passw0rd";

  var totpKey = StellarWallet.util.generateRandomTotpKey();

  var wallet;

  it('should throw MissingField error', function (done) {
    StellarWallet.getWallet({
      username: username,
      password: password
    }).should.be.rejectedWith(StellarWallet.errors.MissingField).and.notify(done);
  });

  it('should throw WalletNotFound error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).should.be.rejectedWith(StellarWallet.errors.WalletNotFound).and.notify(done);
  });

  it('should throw InvalidField error', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: username,
      password: password,
      mainData: mainData // mainData must be stringified
    }).should.be.rejectedWith(StellarWallet.errors.InvalidField).and.notify(done);
  });

  it('should successfully create a wallet', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: username,
      password: password,
      publicKey: keyPair.publicKey,
      keychainData: JSON.stringify(keyPair),
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
      expect(wallet.isTotpEnabled()).to.be.false;
      done();
    });
  });

  it('should throw Forbidden error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: 'wrong password'
    }).should.be.rejectedWith(StellarWallet.errors.Forbidden).and.notify(done);
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

      var fetchedKeychainData = JSON.parse(wallet.getKeychainData());
      expect(fetchedKeychainData).not.to.be.empty;
      expect(fetchedKeychainData).to.be.deep.equal(keyPair);

      expect(wallet.isTotpEnabled()).to.be.false;

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

  it('should throw InvalidTotpCode error while enableTotp because of invalid TOTP code', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    totpCode = ((parseInt(totpCode[0]) + 1) % 10).toString()+totpCode.substr(1);

    wallet.enableTotp({
      totpKey: totpKey,
      totpCode: totpCode,
      secretKey: keyPair.secretKey
    }).should.be.rejectedWith(StellarWallet.errors.InvalidTotpCode).and.notify(done);
  });

  it('should successfully enable TOTP for a wallet', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    wallet.enableTotp({
      totpKey: totpKey,
      totpCode: totpCode,
      secretKey: keyPair.secretKey
    }).then(function() {
      expect(wallet.isTotpEnabled()).to.be.true;
      done();
    });
  });

  it('should successfully send update wallet request and update wallet object', function (done) {
    wallet.update({
      mainData: newMainData,
      keychainData: JSON.stringify(newKeyPair),
      secretKey: keyPair.secretKey
    }).then(function() {
      expect(wallet.getMainData()).not.to.be.empty;
      expect(wallet.getMainData()).to.be.equal(newMainData);

      expect(wallet.getKeychainData()).not.to.be.empty;
      expect(wallet.getKeychainData()).to.be.equal(JSON.stringify(newKeyPair));

      done();
    });
  });

  it('should throw TotpCodeRequired error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).should.be.rejectedWith(StellarWallet.errors.TotpCodeRequired).and.notify(done);
  });

  it('should throw Forbidden error because of invalid TOTP code', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    totpCode = ((parseInt(totpCode[0]) + 1) % 10).toString()+totpCode.substr(1);

    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password,
      totpCode: totpCode
    }).should.be.rejectedWith(StellarWallet.errors.Forbidden).and.notify(done);
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

      expect(wallet.getKeychainData()).not.to.be.empty;
      expect(wallet.getKeychainData()).to.be.equal(JSON.stringify(newKeyPair));

      expect(wallet.isTotpEnabled()).to.be.true;
      done();
    });
  });

  it('should send TOTP lost device request', function (done) {
    StellarWallet.lostTotpDevice({
      server: server,
      username: username,
      password: password
    }).then(function() {
      done();
    });
  });

  it('should successfully disable TOTP for a wallet', function (done) {
    var totpCode = notp.totp.gen(base32.decode(totpKey), {});
    wallet.disableTotp({
      totpCode: totpCode,
      secretKey: keyPair.secretKey
    }).then(function() {
      expect(wallet.isTotpEnabled()).to.be.false;
      done();
    });
  });

  it('should get wallet without TOTP code after disabling TOTP', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: username,
      password: password
    }).then(function(wallet) {
      expect(wallet.getMainData()).not.to.be.empty;
      expect(wallet.getMainData()).to.be.equal(newMainData);

      expect(wallet.getKeychainData()).not.to.be.empty;
      expect(wallet.getKeychainData()).to.be.equal(JSON.stringify(newKeyPair));

      expect(wallet.isTotpEnabled()).to.be.false;
      done();
    });
  });
});
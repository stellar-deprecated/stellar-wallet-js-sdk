'use strict';

var _ = require('lodash');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

var StellarWallet;
if (typeof window === 'undefined') {
  StellarWallet = require('../index.js');
}

var expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);

describe('stellar-wallet', function () {
  var self = this;
  self.timeout(30000);

  var server = 'http://localhost:3000/v2';
  var mockServer;

  before(function(done) {
    if (typeof window === 'undefined') {
      // Start mock server. In sauce labs environment zuul is responsible for it.
      mockServer = require('./server.js');
    }

    // Wait for StellarWallet to load in a browser
    function waitForLoad() {
      if (typeof window !== 'undefined' && typeof window.StellarWallet === 'undefined') {
        setTimeout(waitForLoad, 1000);
      } else {
        // zuul hacks
        if (typeof StellarWallet === 'undefined') {
          StellarWallet = window.StellarWallet;
          server = '/v2';
        }
        done();
      }
    }
    waitForLoad();
  });

  after(function(done) {
    if (mockServer) {
      mockServer.close();
    }
    done();
  });

  function getNoTotpWallet() {
    return StellarWallet.getWallet({
      server: server,
      username: 'bartek@stellar.org',
      password: '1234567890'
    });
  }

  function getTotpWallet() {
    return StellarWallet.getWallet({
      server: server,
      username: 'jared@stellar.org',
      password: '0987654321',
      totpCode: '000000'
    });
  }

  it('should throw MissingField error when server is missing', function (done) {
    StellarWallet.getWallet({
      username: 'test@stellar.org',
      password: '1234567890'
    }).should.be.rejectedWith(StellarWallet.errors.MissingField).and.notify(done);
  });

  it('should throw WalletNotFound error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: 'notfound@stellar.org',
      password: 'test'
    }).should.be.rejectedWith(StellarWallet.errors.WalletNotFound).and.notify(done);
  });

  it('should throw InvalidField error', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: 'bartek@stellar.org',
      password: '1234567890',
      mainData: {email: 'bartek@stellar.org'} // mainData must be stringified
    }).should.be.rejectedWith(StellarWallet.errors.InvalidField).and.notify(done);
  });

  it('should throw InvalidUsername error', function (done) {
    StellarWallet.createWallet({
      server: server,
      username: '^&*^#*&$^&*',
      password: '1234567890',
      mainData: 'mainData'
    }).should.be.rejectedWith(StellarWallet.errors.InvalidField).and.notify(done);
  });

  it('should successfully create a wallet', function (done) {
    var keyPair = StellarWallet.util.generateKeyPair();

    StellarWallet.createWallet({
      server: server,
      username: 'new_user@stellar.org',
      password: 'xxx',
      publicKey: keyPair.publicKey,
      keychainData: JSON.stringify(keyPair),
      mainData: 'mainData',
      kdfParams: {
        algorithm: 'scrypt',
        bits: 256,
        n: Math.pow(2,11), // To make tests faster
        r: 8,
        p: 1
      }
    }).then(function(wallet) {
      expect(wallet.getServer()).to.be.equal(server);
      expect(wallet.getMainData()).to.be.equal('mainData');
      expect(wallet.isTotpEnabled()).to.be.false;
      done();
    });
  });

  it('should fail with UsernameAlreadyTaken error', function (done) {
    var keyPair = StellarWallet.util.generateKeyPair();

    StellarWallet.createWallet({
      server: server,
      username: 'bartek@stellar.org',
      password: 'qwerty',
      publicKey: keyPair.publicKey,
      keychainData: JSON.stringify(keyPair),
      mainData: 'someData',
      kdfParams: {
        algorithm: 'scrypt',
        bits: 256,
        n: Math.pow(2,11), // To make tests faster
        r: 8,
        p: 1
      }
    }).should.be.rejectedWith(StellarWallet.errors.UsernameAlreadyTaken).and.notify(done);
  });

  it('should throw Forbidden error when wrong password is passed', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: 'bartek@stellar.org',
      password: 'wrong password'
    }).should.be.rejectedWith(StellarWallet.errors.Forbidden).and.notify(done);
  });

  it('should successfully get wallet', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: 'bartek@stellar.org',
      password: '1234567890'
    }).then(function(wallet) {
      expect(wallet.getUsername()).to.be.equal('bartek@stellar.org');
      expect(wallet.getServer()).to.be.equal(server);
      expect(wallet.getUpdatedAt()).to.be.equal('2014-10-03 16:30:29');

      var fetchedMainData = JSON.parse(wallet.getMainData());
      expect(fetchedMainData).not.to.be.empty;
      expect(fetchedMainData.username).to.be.equal('bartek');

      var fetchedKeychainData = JSON.parse(wallet.getKeychainData());
      expect(fetchedKeychainData).not.to.be.empty;
      expect(fetchedKeychainData.signingKeys.address).to.be.equal('gK1UXqXDKRANNFvmcHXHhxwM2KnqiszWSj');

      expect(wallet.isTotpEnabled()).to.be.false;

      done();
    });
  });

  it('should throw InvalidTotpCode error while enableTotp because of invalid TOTP code', function (done) {
    var totpKey = StellarWallet.util.generateRandomTotpKey();

    getNoTotpWallet().then(function(wallet) {
      wallet.enableTotp({
        totpKey: totpKey,
        totpCode: '123456',
        secretKey: 'u5u/mMcUgKLMY4Er2h1J94Xf2cS+1w3hSK+kfwCGoqzV88+SyOraYvvn2rPvJvakfXIsWGlix9zBnXwKKfZZEQ=='
      }).should.be.rejectedWith(StellarWallet.errors.InvalidTotpCode).and.notify(done);
    });
  });

  it('should successfully enable TOTP for a wallet', function (done) {
    var totpKey = StellarWallet.util.generateRandomTotpKey();

    getNoTotpWallet().then(function(wallet) {
      wallet.enableTotp({
        totpKey: totpKey,
        totpCode: '000000',
        secretKey: 'u5u/mMcUgKLMY4Er2h1J94Xf2cS+1w3hSK+kfwCGoqzV88+SyOraYvvn2rPvJvakfXIsWGlix9zBnXwKKfZZEQ=='
      }).then(function() {
        expect(wallet.isTotpEnabled()).to.be.true;
        done();
      });
    });
  });

  it('should successfully send update wallet request and update wallet object', function (done) {
    getNoTotpWallet().then(function(wallet) {
      wallet.updateMainData({
        mainData: 'newMainData',
        secretKey: 'u5u/mMcUgKLMY4Er2h1J94Xf2cS+1w3hSK+kfwCGoqzV88+SyOraYvvn2rPvJvakfXIsWGlix9zBnXwKKfZZEQ=='
      }).then(function() {
        expect(wallet.getMainData()).not.to.be.empty;
        expect(wallet.getMainData()).to.be.equal('newMainData');
        done();
      });
    });
  });

  it('should successfully send update password and update wallet object');

  it('should throw TotpCodeRequired error', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: 'jared@stellar.org',
      password: '0987654321'
    }).should.be.rejectedWith(StellarWallet.errors.TotpCodeRequired).and.notify(done);
  });

  it('should throw Forbidden error because of invalid TOTP code', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: 'jared@stellar.org',
      password: '0987654321',
      totpCode: '123456'
    }).should.be.rejectedWith(StellarWallet.errors.Forbidden).and.notify(done);
  });

  it('should get wallet with TOTP required', function (done) {
    StellarWallet.getWallet({
      server: server,
      username: 'jared@stellar.org',
      password: '0987654321',
      totpCode: '000000'
    }).then(function(wallet) {
      expect(wallet.getUpdatedAt()).to.be.equal('2014-10-03 17:10:51');
      expect(wallet.getMainData()).not.to.be.empty;
      expect(JSON.parse(wallet.getMainData()).username).to.be.equal('jared');

      expect(wallet.getKeychainData()).not.to.be.empty;
      expect(JSON.parse(wallet.getKeychainData()).signingKeys.address).to.be.equal('grdCvaWb6VXRdF6k1osi1LTUqjCyocK1m');

      expect(wallet.isTotpEnabled()).to.be.true;
      done();
    });
  });

  it('should send TOTP lost device request', function (done) {
    StellarWallet.lostTotpDevice({
      server: server,
      username: 'jared@stellar.org',
      password: '0987654321'
    }).then(function() {
      done();
    });
  });

  it('should successfully disable TOTP for a wallet', function (done) {
    getTotpWallet().then(function(wallet) {
      wallet.disableTotp({
        totpCode: '000000',
        secretKey: 'JLBApQUe4QAsQkiaUOkJ94wgtMMmiyzcxP+DeFPynKnuxJAEX3ifUYzoxeEdeQLIXSZ0A6XUBJFktUdwIh+pOg=='
      }).then(function() {
        expect(wallet.isTotpEnabled()).to.be.false;
        done();
      });
    })
  });

  it('should enable recovery', function (done) {
    getNoTotpWallet().then(function(wallet) {
      wallet.enableRecovery({
        secretKey: 'u5u/mMcUgKLMY4Er2h1J94Xf2cS+1w3hSK+kfwCGoqzV88+SyOraYvvn2rPvJvakfXIsWGlix9zBnXwKKfZZEQ==',
        recoveryCode: StellarWallet.util.generateRandomRecoveryCode()
      }).should.be.fulfilled.and.notify(done);
    })
  });

  it('should throw Forbidden when invalid recoveryCode is passed', function (done) {
    StellarWallet.recover({
      server: server,
      username: 'bartek@stellar.org',
      recoveryCode: "abc"
    }).should.be.rejectedWith(StellarWallet.errors.Forbidden).and.notify(done);
  });

  it('should get masterKey using recoveryCode', function (done) {
    StellarWallet.recover({
      server: server,
      username: 'bartek@stellar.org',
      recoveryCode: 'Be6dkzayXgh7Zy6Z5TkYs4ob2trxSD36ayvPVB9SQRd8'
    }).then(function(masterKey) {
      done();
    });
  });

  it('should get wallet object using recoveryData, change password and get wallet using new password', function (done) {
    StellarWallet.recover({
      server: server,
      username: 'bartek@stellar.org',
      recoveryCode: 'Be6dkzayXgh7Zy6Z5TkYs4ob2trxSD36ayvPVB9SQRd8'
    }).then(function(masterKey) {
      return StellarWallet.getWallet({
        server: server,
        username: 'bartek@stellar.org',
        masterKey: masterKey
      });
    }).then(function(wallet) {
      var fetchedMainData = JSON.parse(wallet.getMainData());
      expect(fetchedMainData).not.to.be.empty;
      expect(fetchedMainData.username).to.be.equal('bartek');

      var fetchedKeychainData = JSON.parse(wallet.getKeychainData());
      expect(fetchedKeychainData).not.to.be.empty;
      expect(fetchedKeychainData.signingKeys.address).to.be.equal('gK1UXqXDKRANNFvmcHXHhxwM2KnqiszWSj');

      return wallet;
    })/*.then(function(w) {
      return w.changePassword({
        newPassword: 'newPassword',
        secretKey: keyPair.secretKey,
        kdfParams: {
          algorithm: 'scrypt',
          bits: 256,
          n: Math.pow(2,11), // To make tests faster
          r: 8,
          p: 1
        }
      });
    })*/.should.be.fulfilled.and.notify(done);
  });

  it('should successfully send delete wallet request');

  it('getWallet should not modify params argument object', function(done) {
    var params = {
      server: server,
      username: 'bartek@stellar.org',
      password: '1234567890'
    };
    var paramsCopy = _.cloneDeep(params);
    StellarWallet.getWallet(params).should.be.fulfilled.then(function() {
      expect(params).to.be.deep.equal(paramsCopy);
    }).should.notify(done);
  })
});
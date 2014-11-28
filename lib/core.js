'use strict';

var _ = require('lodash');
var errors = require('./errors');
var Promise = require('bluebird');
var protocol = require('./protocol');
var util = {
  crypto: require('./util/crypto'),
  totp: require('./util/totp'),
  keypair: require('./util/keypair')
};
var Wallet = require('./wallet');

function createWalletObject(initData) {
  var wallet = new Wallet(initData);
  return Promise.resolve(wallet);
}

module.exports = {
  createWallet: function(p) {
    var params = _.cloneDeep(p);
    return protocol.createWallet(params)
      .then(createWalletObject);
  },
  getWallet: function(p) {
    var params = _.cloneDeep(p);
    return protocol.login(params)
      .then(createWalletObject);
  },
  createFromData: function(initData) {
    return new Wallet(initData);
  },
  lostTotpDevice: function(p) {
    var params = _.cloneDeep(p);
    return protocol.lostTotpDevice(params);
  },
  recover: function(p) {
    var params = _.cloneDeep(p);
    return protocol.showRecovery(params);
  },
  errors: errors,
  util: {
    generateRandomTotpKey: util.totp.generateRandomTotpKey,
    generateRandomRecoveryCode: util.crypto.generateRandomRecoveryCode,
    generateTotpUri: util.totp.generateTotpUri,
    generateKeyPair: util.keypair.generateKeyPair
  }
};

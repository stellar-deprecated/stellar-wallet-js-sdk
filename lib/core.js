'use strict';

var _ = require('lodash');
var errors = require('./errors');
var Promise = require('bluebird');
var protocol = require('./protocol');
var util = {
  totp: require('./util/totp'),
  keypair: require('./util/keypair')
};
var Wallet = require('./wallet');

function createWalletObject(initData) {
  var wallet = new Wallet(initData);
  return Promise.resolve(wallet);
}

module.exports = {
  createWallet: function(params) {
    return protocol.createWallet(params)
      .then(createWalletObject);
  },
  getWallet: function(params) {
    return protocol.login(params)
      .then(createWalletObject);
  },
  createFromData: function(initData) {
    return new Wallet(initData);
  },
  lostTotpDevice: function(params) {
    return protocol.lostTotpDevice(params);
  },
  recover: function(params) {
    return protocol.showRecovery(params);
  },
  errors: errors,
  util: {
    generateRandomTotpKey: util.totp.generateRandomTotpKey,
    generateTotpUri: util.totp.generateTotpUri,
    generateKeyPair: util.keypair.generateKeyPair
  }
};

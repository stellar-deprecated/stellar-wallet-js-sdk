'use strict';

var _ = require('lodash');
var errors = require('./errors');
var Promise = require('bluebird');
var protocol = require('./protocol');
var totp = require('./util/totp');
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
  errors: errors,
  util: {
    generateRandomTotpKey: totp.generateRandomTotpKey,
    generateTotpUri: totp.generateTotpUri
  }
};


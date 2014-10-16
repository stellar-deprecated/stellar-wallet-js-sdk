'use strict';

var _ = require('lodash');
var crypto = require('./util/crypto');
var errors = require('./errors');
var sjcl = require('./util/sjcl');
var nacl = require('tweetnacl');
var Promise = require('bluebird');
var protocol = require('./protocol');

function Wallet(params) {
  var self = this;
  var properties = [
    'server',
    'username',
    'rawWalletId',
    'rawWalletKey',
    'rawMainData',
    'rawKeychainData',
    'lockVersion'
  ];

  _.each(properties, function(param) {
    self[param] = params[param];
  });

  // rtrim /
  this.server = this.server.replace(/\/+$/g,'');
  this.walletId = sjcl.codec.base64.fromBits(this.rawWalletId);
}

Wallet.prototype.getServer = function() {
  return this.server;
};

Wallet.prototype.getUsername = function() {
  return this.username;
};

Wallet.prototype.getMainData = function() {
  return this.rawMainData;
};

Wallet.prototype.getKeychainData = function() {
  return this.rawKeychainData;
};

Wallet.prototype.update = function(params) {
  params = _.extend(params, _.pick(this, [
    'server',
    'walletId',
    'lockVersion',
    'rawWalletKey'
  ]));

  var self = this;
  return protocol.updateWallet(params)
    .then(function(updateData) {
      self.lockVersion = updateData.newLockVersion;
      self.rawMainData = updateData.rawMainData;
      self.rawKeychainData = updateData.rawKeychainData;

      return Promise.resolve();
    });
};

Wallet.prototype.enableTotp = function(params) {
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId',
    'lockVersion'
  ]));
  var self = this;
  return protocol.enableTotp(params)
    .then(function(updateData) {
      self.lockVersion = updateData.newLockVersion;
      return Promise.resolve();
    });
};

Wallet.prototype.disableTotp = function(params) {
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId',
    'lockVersion'
  ]));
  var self = this;
  return protocol.disableTotp(params)
      .then(function(updateData) {
        self.lockVersion = updateData.newLockVersion;
        return Promise.resolve();
      });
};

module.exports = Wallet;
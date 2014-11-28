'use strict';

var _ = require('lodash');
var crypto = require('./util/crypto');
var errors = require('./errors');
var sjcl = require('./util/sjcl');
var nacl = require('tweetnacl');
var Promise = require('bluebird');
var protocol = require('./protocol');

function Wallet(p) {
  var params = _.cloneDeep(p);
  var self = this;
  var properties = [
    'server',
    'username',
    'rawMasterKey',
    'rawWalletId',
    'rawWalletKey',
    'rawMainData',
    'rawKeychainData',
    'lockVersion',
    'totpEnabled'
  ];

  _.each(properties, function(param) {
    self[param] = params[param];
  });

  this.updateEncodedValues = function() {
    this.masterKey = sjcl.codec.base64.fromBits(this.rawMasterKey);
    this.walletId = sjcl.codec.base64.fromBits(this.rawWalletId);
    this.walletKey = sjcl.codec.base64.fromBits(this.rawWalletKey);
  };

  // rtrim /
  this.server = this.server.replace(/\/+$/g,'');
  this.updateEncodedValues();
}

Wallet.prototype.getServer = function() {
  return this.server;
};

Wallet.prototype.getUsername = function() {
  return this.username;
};

Wallet.prototype.getWalletId = function() {
  return this.walletId;
};

Wallet.prototype.getWalletKey = function() {
  return this.walletKey;
};

Wallet.prototype.getMainData = function() {
  return this.rawMainData;
};

Wallet.prototype.getKeychainData = function() {
  return this.rawKeychainData;
};

Wallet.prototype.updateMainData = function(p) {
  var params = _.cloneDeep(p);
  params = _.extend(params, _.pick(this, [
    'server',
    'walletId',
    'username',
    'lockVersion',
    'rawWalletKey'
  ]));

  var self = this;
  return protocol.updateMainData(params)
    .then(function(updateData) {
      self.lockVersion = updateData.newLockVersion;
      self.rawMainData = updateData.rawMainData;

      return Promise.resolve();
    });
};

Wallet.prototype.delete = function(p) {
  var params = _.cloneDeep(p);
  params = _.extend(params, _.pick(this, [
    'server',
    'walletId',
    'username',
    'lockVersion'
  ]));

  return protocol.deleteWallet(params);
};

Wallet.prototype.changePassword = function(p) {
  var params = _.cloneDeep(p);
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId',
    'rawMainData',
    'rawKeychainData',
    'lockVersion'
  ]));

  var self = this;
  return protocol.changePassword(params)
    .then(function(updateData) {
      self.rawWalletId  = updateData.rawWalletId;
      self.rawWalletKey = updateData.rawWalletKey;
      self.rawMasterKey = updateData.rawMasterKey;
      self.lockVersion  = updateData.newLockVersion;
      self.updateEncodedValues();

      return Promise.resolve();
    });
};

Wallet.prototype.isTotpEnabled = function() {
  return this.totpEnabled;
};

Wallet.prototype.enableTotp = function(p) {
  var params = _.cloneDeep(p);
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
      self.totpEnabled = true;
      return Promise.resolve();
    });
};

Wallet.prototype.enableRecovery = function(p) {
  var params = _.cloneDeep(p);
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId',
    'masterKey',
    'lockVersion'
  ]));
  var self = this;
  return protocol.enableRecovery(params)
    .then(function(data) {
      self.lockVersion = data.newLockVersion;
      return Promise.resolve();
    });
};

Wallet.prototype.disableTotp = function(p) {
  var params = _.cloneDeep(p);
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
      self.totpEnabled = false;
      return Promise.resolve();
    });
};

Wallet.prototype.updateLockVersion = function(p) {
  var params = _.cloneDeep(p);
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId'
  ]));
  var self = this;
  return protocol.getLockVersion(params)
    .then(function(lockVersion) {
      self.lockVersion = lockVersion;
      return Promise.resolve();
    });
};

module.exports = Wallet;
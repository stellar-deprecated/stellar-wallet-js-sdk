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
    'rawKeyPair',
    'lockVersion'
  ];

  _.each(properties, function(param) {
    self[param] = params[param];
  });

  // rtrim /
  this.server = this.server.replace(/\/+$/g,'');
  this.walletId = sjcl.codec.base64.fromBits(this.rawWalletId);

  this.rawKeyPairBase64 = this.rawKeyPair;

  this.rawKeyPair = {
    publicKey: nacl.util.decodeBase64(this.rawKeyPair.publicKey),
    secretKey: nacl.util.decodeBase64(this.rawKeyPair.secretKey)
  };
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

Wallet.prototype.getKeyPair = function() {
  return this.rawKeyPairBase64;
};

Wallet.prototype.update = function(params) {
  params = _.extend(params, _.pick(this, [
    'server',
    'walletId',
    'lockVersion',
    'rawKeyPair',
    'rawWalletKey'
  ]));

  params.newKeyPair = params.keyPair;
  delete params.keyPair;

  var self = this;
  return protocol.updateWallet(params)
    .then(function(updateData) {
      self.lockVersion = updateData.newLockVersion;
      self.rawMainData = updateData.rawMainData;

      self.rawKeyPair = {
        publicKey: nacl.util.decodeBase64(updateData.rawKeyPair.publicKey),
        secretKey: nacl.util.decodeBase64(updateData.rawKeyPair.secretKey)
      };

      return Promise.resolve();
    });
};

Wallet.prototype.setupTotp = function(params) {
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId',
    'totpKey',
    'totpCode',
    'lockVersion',
    'rawKeyPair'
  ]));
  var self = this;
  return protocol.setupTotp(params)
    .then(function(updateData) {
      self.lockVersion = updateData.newLockVersion;
      return Promise.resolve();
    });
};

Wallet.prototype.signMessage = function(message) {
  message = nacl.util.decodeUTF8(message);
  var signature = nacl.sign.detached(message, this.rawKeyPair.secretKey);
  return nacl.util.encodeBase64(signature);
};

module.exports = Wallet;
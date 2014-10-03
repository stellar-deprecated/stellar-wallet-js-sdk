'use strict';

var _ = require('lodash');
var crypto = require('./util/crypto');
var errors = require('./errors');
var sjcl = require('./util/sjcl');
var nacl = require('tweetnacl');
var protocol = require('./protocol');

function Wallet(params) {
  var self = this;
  var properties = [
    'server',
    'username',
    'rawWalletId',
    'rawMainData',
    'rawKeychainData',
    'lockVersion'
  ];

  _.each(properties, function(param) {
    self[param] = params[param];
  });

  if (_.isEmpty(this.server)) {
    throw new errors.MissingField('server parameter is required.');
  }

  // rtrim /
  this.server = this.server.replace(/\/+$/g,'');
  this.walletId = nacl.util.encodeBase64(this.rawWalletId);
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

Wallet.prototype.setupTOTP = function(params) {
  params = _.extend(params, _.pick(this, [
    'server',
    'username',
    'walletId',
    'totpKey',
    'totpCode',
    'lockVersion'
  ]));
  return protocol.setupTotp(params);
};

module.exports = Wallet;
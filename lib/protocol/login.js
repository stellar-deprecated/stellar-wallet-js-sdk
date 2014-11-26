'use strict';

var _ = require('lodash');
var common = require('./common');
var crypto = require('../util/crypto');
var errors = require('../errors');
var nacl = require('tweetnacl');
var Promise = require('bluebird');
var request = require('superagent');
var sjcl = require('../util/sjcl');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(common.totpCodeToString)
    .then(validateParams)
    .then(common.walletShowLoginParams)
    .then(ensureTotp)
    .then(calculateWalletId)
    .then(walletShow)
    .then(decryptWallet);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    // TODO require password or masterKey
    //.then(validate.present("password"));
}

function ensureTotp(params) {
  if (params.totpRequired && _.isEmpty(params.totpCode)) {
    return Promise.reject(new errors.TotpCodeRequired);
  }
  return Promise.resolve(params);
}

function calculateWalletId(params) {
  // We allow to get wallet using password or by providing recovery data: masterKey
  if (params.password) {
    params.rawMasterKey = crypto.calculateMasterKey(params.salt, params.username, params.password, params.kdfParams);
  } else {
    params.rawMasterKey = sjcl.codec.base64.toBits(params.masterKey);
  }
  params.rawWalletId = crypto.deriveWalletId(params.rawMasterKey); // W
  params.rawWalletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw
  params.walletId = sjcl.codec.base64.fromBits(params.rawWalletId);
  return Promise.resolve(params);
}

function walletShow(params) {
  var resolver = Promise.pending();

  var data = {
    username: params.username,
    walletId: params.walletId
  };

  if (params.totpRequired) {
    data.totpCode = params.totpCode;
  }

  request
    .post(params.server+'/wallets/show')
    .type('json')
    .send(data)
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        params = _.extend(params, _.pick(res.body, ['lockVersion', 'mainData', 'keychainData']));
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

function decryptWallet(params) {
  var wallet = _.pick(params, [
    'server',
    'username',
    'rawMasterKey',
    'rawWalletId',
    'rawWalletKey',
    'rawMainData',
    'rawKeychainData',
    'lockVersion'
  ]);

  wallet.rawMainData = crypto.decryptData(params.mainData, params.rawWalletKey);
  wallet.rawKeychainData = crypto.decryptData(params.keychainData, params.rawWalletKey);
  wallet.totpEnabled = params.totpRequired;

  return Promise.resolve(wallet);
}
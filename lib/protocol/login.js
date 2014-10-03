'use strict';

var _ = require('lodash');
var crypto = require('../util/crypto');
var errors = require('../errors');
var nacl = require('tweetnacl');
var Promise = require('bluebird');
var request = require('superagent');
var sjcl = require('../util/sjcl');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(validateParams)
    .then(fetchRawPrivateKey)
    .then(walletShowLoginParams)
    .then(ensureTotp)
    .then(calculateWalletId)
    .then(walletShow)
    .then(decryptWallet);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("password"))
    .then(validate.present("privateKey"));
}

function fetchRawPrivateKey(params) {
  params.rawPrivateKey = nacl.util.decodeBase64(params.privateKey);
  return Promise.resolve(params);
}

function walletShowLoginParams(params) {
  var resolver = Promise.pending();
  request
    .post(params.server+'/wallets/show_login_params')
    .type('json')
    .send({
      username: params.username
    })
    .end(function(err, res) {
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        if (res.body.code == 'not_found') {
          resolver.reject(new errors.WalletNotFound());
        } else if (res.body.code == 'forbidden') {
          resolver.reject(new errors.Forbidden());
        } else {
          resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
        }
      } else {
        params.salt = res.body.salt;
        params.kdfParams = JSON.parse(res.body.kdfParams);
        params.totpRequired = res.body.totpRequired;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

function ensureTotp(params) {
  if (params.totpRequired && _.isEmpty(params.totpCode)) {
    return Promise.reject(new errors.TotpCodeRequired);
  }
  return Promise.resolve(params);
}

function calculateWalletId(params) {
  var masterKey = crypto.calculateMasterKey(params.salt, params.username, params.password, params.kdfParams);
  var walletId = crypto.deriveWalletId(masterKey); // W
  params.rawWalletId = walletId;
  params.walletId = sjcl.codec.base64.fromBits(walletId);
  params.rawWalletKey = crypto.deriveWalletKey(masterKey); // Kw
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
      if (err) {
        resolver.reject(err);
      } else if (res.body.status === 'fail') {
        resolver.reject(new errors.UnknownError());
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
    'rawWalletId',
    'rawMainData',
    'rawKeychainData',
    'lockVersion',
    'rawPrivateKey'
  ]);

  wallet.rawMainData = crypto.decryptData(params.mainData, params.rawWalletKey);
  wallet.rawKeychainData = crypto.decryptData(params.keychainData, params.rawWalletKey);

  return Promise.resolve(wallet);
}
'use strict';

var _ = require('lodash');
var config = require('../config');
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
    .then(getKdfParams)
    .then(stringifyParams)
    .then(prepareData)
    .then(sendWalletCreateRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("username"))
    .then(validate.present("password"))
    .then(validate.present("publicKey"))
    .then(validate.present("mainData"))
    .then(validate.present("keychainData"));
}

function getKdfParams(params) {
  // User provided kdfParams
  if (_.isObject(params.kdfParams)) {
    return Promise.resolve(params);
  }

  // Fetching kdfParams from stellar-wallet server
  var resolver = Promise.pending();
  request
    .get(config.get('server')+'/kdf_params')
    .end(function(err, res) {
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else {
        params.kdfParams = res.body;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

var kdfParamsRaw;
function stringifyParams(params) {
  kdfParamsRaw = params.kdfParams; // We need a raw JSON in encryptData

  for (var key in params) {
    if (!_.isString(params[key])) {
      params[key] = JSON.stringify(params[key]);
    }
  }

  return Promise.resolve(params);
}

function prepareData(params) {
  params.salt = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
  var salt = crypto.sha256(params.salt+params.username);

  var masterKey = sjcl.misc.scrypt(
    params.password,
    salt,
    // TODO pick one of options returned by stellar-wallet server
    Math.pow(2,11), //params.kdfParamsRaw.n,
    kdfParamsRaw.r,
    kdfParamsRaw.p,
    kdfParamsRaw.bits
  );

  var walletId = crypto.deriveWalletId(masterKey); // W
  var walletKey = crypto.deriveWalletKey(masterKey); // Kw

  params.walletId = sjcl.codec.hex.fromBits(walletId);
  params.mainData = crypto.encryptData(params.mainData, walletKey);
  params.mainDataHash = crypto.sha1(params.mainData);
  params.keychainData = crypto.encryptData(params.keychainData, walletKey);
  params.keychainDataHash = crypto.sha1(params.keychainData);

  return Promise.resolve(params);
}

function sendWalletCreateRequest(params) {
  var resolver = Promise.pending();
  request
    .post(config.get('server')+'/wallets/create')
    .type('json')
    .send(_.pick(params, [
      'username',
      'walletId',
      'salt',
      'publicKey',
      'mainData',
      'mainDataHash',
      'keychainData',
      'keychainDataHash',
      'kdfParams'
    ]))
    .end(function(err, res) {
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        if (res.body.code == 'not_found') {
          resolver.reject(new errors.WalletNotFound());
        } else {
          resolver.reject(new errors.UnknownError());
        }
      } else {
        resolver.resolve(res.body);
      }
    });

  return resolver.promise;
}

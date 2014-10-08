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
    .then(getKdfParams)
    .then(prepareDataToSend)
    .then(sendWalletCreateRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("password"))
    .then(validate.string("mainData"))
    .then(validate.keyPair("keyPair"));
}

function getKdfParams(params) {
  // User provided kdfParams
  if (_.isObject(params.kdfParams)) {
    return Promise.resolve(params);
  }

  // Fetching kdfParams from stellar-wallet server
  var resolver = Promise.pending();
  request
    .get(params.server+'/kdf_params')
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else {
        params.kdfParams = res.body;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

function prepareDataToSend(params) {
  var s0 = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
  var masterKey = crypto.calculateMasterKey(s0, params.username, params.password, params.kdfParams);
  var walletId = crypto.deriveWalletId(masterKey); // W
  var walletKey = crypto.deriveWalletKey(masterKey); // Kw

  params.kdfParams = JSON.stringify(params.kdfParams);

  params.salt = s0;
  params.rawWalletId = walletId;
  params.walletId = sjcl.codec.base64.fromBits(walletId);
  params.rawWalletKey = walletKey;

  params.rawMainData = params.mainData;
  params.mainData = crypto.encryptData(params.mainData, walletKey);
  params.mainDataHash = crypto.sha1(params.mainData);

  params.rawKeyPair = params.keyPair;
  params.publicKey = params.keyPair.publicKey;
  params.keyPair = JSON.stringify(params.keyPair);

  params.keychainData = crypto.encryptData(params.keyPair, walletKey);
  params.keychainDataHash = crypto.sha1(params.keychainData);

  return Promise.resolve(params);
}

function sendWalletCreateRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/wallets/create')
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
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else /* istanbul ignore if */ if (res.body.status !== 'success') {
        resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
      } else {
        var wallet = _.pick(params, [
          'server',
          'username',
          'rawWalletId',
          'rawWalletKey',
          'rawMainData',
          'rawKeyPair'
        ]);
        wallet.lockVersion = 0;
        resolver.resolve(wallet);
      }
    });

  return resolver.promise;
}

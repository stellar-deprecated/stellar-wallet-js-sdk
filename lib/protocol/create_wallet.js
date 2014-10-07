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
    .then(prepareParams)
    .then(generatePublicKey)
    .then(prepareDataToSend)
    .then(sendWalletCreateRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("password"))
    .then(validate.present("privateKey"))
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
    .get(params.server+'/kdf_params')
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
function prepareParams(params) {
  kdfParamsRaw = params.kdfParams; // We need a raw JSON in encryptData
  params.kdfParams = JSON.stringify(params.kdfParams);

  if (!_.every(_.pick(params, ['mainData', 'keychainData']), _.isString)) {
    return Promise.reject(new errors.InvalidField('mainData and keychainData must be strings.'));
  }

  return Promise.resolve(params);
}

function generatePublicKey(params) {
  var rawPrivateKey = nacl.util.decodeBase64(params.privateKey);
  var keyPair = nacl.sign.keyPair.fromSecretKey(rawPrivateKey);
  params.publicKey = nacl.util.encodeBase64(keyPair.publicKey);
  params.rawPrivateKey = rawPrivateKey;
  return Promise.resolve(params);
}

function prepareDataToSend(params) {
  var s0 = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
  var masterKey = crypto.calculateMasterKey(s0, params.username, params.password, kdfParamsRaw);
  var walletId = crypto.deriveWalletId(masterKey); // W
  var walletKey = crypto.deriveWalletKey(masterKey); // Kw

  params.salt = s0;
  params.rawWalletId = walletId;
  params.walletId = sjcl.codec.base64.fromBits(walletId);
  params.rawWalletKey = walletKey;

  params.rawMainData = params.mainData;
  params.mainData = crypto.encryptData(params.mainData, walletKey);
  params.mainDataHash = crypto.sha1(params.mainData);

  params.rawKeychainData = params.keychainData;
  params.keychainData = crypto.encryptData(params.keychainData, walletKey);
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
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status !== 'success') {
        resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
      } else {
        var wallet = _.pick(params, [
          'server',
          'username',
          'rawWalletId',
          'rawWalletKey',
          'rawMainData',
          'rawKeychainData',
          'rawPrivateKey'
        ]);
        wallet.lockVersion = 0;
        resolver.resolve(wallet);
      }
    });

  return resolver.promise;
}

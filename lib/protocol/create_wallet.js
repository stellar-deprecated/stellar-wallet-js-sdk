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
    .then(validateParams)
    .then(common.getKdfParams)
    .then(prepareDataToSend)
    .then(sendWalletCreateRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("password"))
    .then(validate.string("publicKey"))
    .then(validate.string("mainData"))
    .then(validate.string("keychainData"));
}

function prepareDataToSend(params) {
  var s0 = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
  var masterKey = crypto.calculateMasterKey(s0, params.username, params.password, params.kdfParams);
  var walletId = crypto.deriveWalletId(masterKey); // W
  var walletKey = crypto.deriveWalletKey(masterKey); // Kw

  params.kdfParams = JSON.stringify(params.kdfParams);

  params.salt = s0;
  params.rawMasterKey = masterKey;
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
      'kdfParams',
      // Hack for stellar-wallet run by SDF to allow transition from V1 wallet
      // https://github.com/stellar/stellar-wallet/issues/34
      'usernameProof'
    ]))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        var wallet = _.pick(params, [
          'server',
          'username',
          'rawMasterKey',
          'rawWalletId',
          'rawWalletKey',
          'rawMainData',
          'rawKeychainData'
        ]);
        wallet.lockVersion = 0;
        wallet.totpEnabled = false;
        resolver.resolve(wallet);
      }
    });

  return resolver.promise;
}

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
    .then(sendUpdateRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("walletId"))
    .then(validate.present("rawMainData"))
    .then(validate.present("rawKeychainData"))
    .then(validate.number("lockVersion"))
    // Provided by user
    .then(validate.string("newPassword"))
    .then(validate.string("secretKey"));
}

function prepareDataToSend(params) {
  params.oldWalletId = params.walletId;

  var s0 = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
  var masterKey = crypto.calculateMasterKey(s0, params.username, params.newPassword, params.kdfParams);
  var walletId = crypto.deriveWalletId(masterKey); // W
  var walletKey = crypto.deriveWalletKey(masterKey); // Kw

  params.kdfParams = JSON.stringify(params.kdfParams);

  params.salt = s0;
  params.rawMasterKey = masterKey;
  params.rawWalletId = walletId;
  params.walletId = sjcl.codec.base64.fromBits(walletId);
  params.rawWalletKey = walletKey;

  params.mainData = crypto.encryptData(params.rawMainData, walletKey);
  params.mainDataHash = crypto.sha1(params.mainData);

  params.keychainData = crypto.encryptData(params.rawKeychainData, walletKey);
  params.keychainDataHash = crypto.sha1(params.keychainData);

  return Promise.resolve(params);
}

function sendUpdateRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/wallets/update')
    .type('json')
    .send(_.pick(params, [
      'walletId',
      'salt',
      'kdfParams',
      'mainData',
      'mainDataHash',
      'keychainData',
      'keychainDataHash',
      'lockVersion'
    ]))
    .use(crypto.signRequest(params.oldWalletId, params.secretKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else /* istanbul ignore else */ if (res.body.status === 'success') {
        var updateData = {
          rawWalletId: params.rawWalletId,
          rawWalletKey: params.rawWalletKey,
          rawMasterKey: params.rawMasterKey,
          newLockVersion: res.body.newLockVersion
        };
        resolver.resolve(updateData);
      } else {
        resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
      }
    });

  return resolver.promise;
}

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
    .then(calculateRecoveryId)
    .then(sendRecoveryShowRequest)
    .then(decryptMasterKey);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("recoveryKey"));
}

function calculateRecoveryId(params) {
  params.recoveryId = crypto.sha1(params.recoveryKey);
  return Promise.resolve(params);
}

function sendRecoveryShowRequest(params) {
  var resolver = Promise.pending();

  var data =_.pick(params, [
    'username',
    'recoveryId'
  ]);

  if (params.totpRequired) {
    data.totpCode = params.totpCode;
  }

  request
    .post(params.server+'/wallets/recovery/show')
    .type('json')
    .send(data)
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'success') {
        params.recoveryData = res.body.recoveryData;
        resolver.resolve(params);
      } else {
        /* istanbul ignore else */
        if (res.body.code === 'forbidden') {
          resolver.reject(new errors.Forbidden());
        } else {
          resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
        }
      }
    });

  return resolver.promise;
}

function decryptMasterKey(params) {
  var rawRecoveryKey = sjcl.codec.base64.toBits(params.recoveryKey);
  var masterKey = crypto.decryptData(params.recoveryData, rawRecoveryKey);
  var rawMasterKey = sjcl.codec.base64.toBits(masterKey);
  var walletId = crypto.deriveWalletId(rawMasterKey);
  var walletKey = crypto.deriveWalletKey(rawMasterKey);
  params.walletId = sjcl.codec.base64.fromBits(walletId);
  params.walletKey = sjcl.codec.base64.fromBits(walletKey);

  return Promise.resolve(_.pick(params, ['walletId', 'walletKey']));
}

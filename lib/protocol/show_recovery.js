'use strict';

var _ = require('lodash');
var base58 = require('bs58');
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
    .then(validate.present("recoveryCode"));
}

function calculateRecoveryId(params) {
  params.recoveryId = crypto.sha1(params.recoveryCode);
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
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        params.recoveryData = res.body.recoveryData;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

function decryptMasterKey(params) {
  var rawRecoveryKey = base58.decode(params.recoveryCode);
  rawRecoveryKey     = crypto.bytesToWords(rawRecoveryKey);
  var masterKey = crypto.decryptData(params.recoveryData, rawRecoveryKey);
  return Promise.resolve(masterKey);
}

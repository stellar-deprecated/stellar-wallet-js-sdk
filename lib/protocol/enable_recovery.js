'use strict';

var _ = require('lodash');
var base58 = require('bs58');
var crypto = require('../util/crypto');
var errors = require('../errors');
var sjcl = require('../util/sjcl');
var Promise = require('bluebird');
var request = require('superagent');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(validateParams)
    .then(prepareDataToSend)
    .then(sendRecoveryEnableRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("walletId"))
    .then(validate.present("masterKey"))
    .then(validate.present("secretKey"))
    .then(validate.present("recoveryCode"))
    .then(validate.number("lockVersion"));
}

function prepareDataToSend(params) {
  params.recoveryId   = crypto.sha1(params.recoveryCode);
  var rawRecoveryKey  = base58.decode(params.recoveryCode);
  rawRecoveryKey      = crypto.bytesToWords(rawRecoveryKey);
  params.recoveryData = crypto.encryptData(params.masterKey, rawRecoveryKey);
  return Promise.resolve(params);
}

function sendRecoveryEnableRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/wallets/recovery/enable')
    .type('json')
    .send(_.pick(params, [
      'lockVersion',
      'recoveryId',
      'recoveryData'
    ]))
    .use(crypto.signRequest(params.username, params.walletId, params.secretKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        params.newLockVersion = res.body.newLockVersion;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

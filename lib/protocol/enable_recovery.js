'use strict';

var _ = require('lodash');
var crypto = require('../util/crypto');
var errors = require('../errors');
var nacl = require('tweetnacl');
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
    .then(validate.number("lockVersion"));
}

function prepareDataToSend(params) {
  var rawRecoveryKey  = nacl.randomBytes(8);
  params.recoveryKey  = new Buffer(rawRecoveryKey).toString('hex');
  params.recoveryId   = crypto.sha1(params.recoveryKey);
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
    .use(crypto.signRequest(params.walletId, params.secretKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'success') {
        params.newLockVersion = res.body.newLockVersion;
        resolver.resolve(params);
      } else {
        resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
      }
    });

  return resolver.promise;
}

'use strict';

var _ = require('lodash');
var base32 = require('thirty-two');
var common = require('./common');
var crypto = require('../util/crypto');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(common.totpCodeToString)
    .then(validateParams)
    .then(transformTotpKey)
    .then(sendTotpEnableRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("walletId"))
    .then(validate.present("secretKey"))
    .then(validate.present("totpKey"))
    .then(validate.present("totpCode"))
    .then(validate.number("lockVersion"));
}

// stellar-wallet server accepts base64 encoded keys. Users provide base32 encoded keys.
function transformTotpKey(params) {
  params.totpKey = base32.decode(params.totpKey);
  params.totpKey = params.totpKey.toString('base64');
  return Promise.resolve(params);
}

function sendTotpEnableRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/totp/enable')
    .type('json')
    .send(_.pick(params, [
      'lockVersion',
      'totpKey',
      'totpCode'
    ]))
    .use(crypto.signRequest(params.username, params.walletId, params.secretKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        resolver.resolve(_.pick(res.body, 'newLockVersion'));
      }
    });

  return resolver.promise;
}

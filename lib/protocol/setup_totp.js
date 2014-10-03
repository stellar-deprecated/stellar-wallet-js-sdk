'use strict';

var _ = require('lodash');
var base32 = require('thirty-two');
var crypto = require('../util/crypto');
var errors = require('../errors');
var nacl = require('tweetnacl');
var Promise = require('bluebird');
var request = require('superagent');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(validateParams)
    .then(transformTOTPKey)
    .then(sendTOTPEnableRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("walletId"))
    .then(validate.present("privateKey"))
    .then(validate.present("totpKey"))
    //.then(validate.present("totpCode"))
    .then(validate.number("lockVersion"));
}

// stellar-wallet server accepts base64 encoded keys. Users provide base32 encoded keys.
function transformTOTPKey(params) {
  params.totpKey = base32.decode(params.totpKey);
  params.totpKey = nacl.util.encodeBase64(params.totpKey);
  return Promise.resolve(params);
}

function sendTOTPEnableRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/totp/enable')
    .type('json')
    .send(_.pick(params, [
      'walletId',
      'lockVersion',
      'totpKey',
      'totpCode'
    ]))
    .use(crypto.signRequest(params.walletId, params.privateKey))
    .end(function(err, res) {
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(new errors.UnknownError());
      } else {
        resolver.resolve(res.body);
      }
    });

  return resolver.promise;
}

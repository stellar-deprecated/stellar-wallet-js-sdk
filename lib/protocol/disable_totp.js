'use strict';

var _ = require('lodash');
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
      .then(sendTotpDisableRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
      .then(validate.present("server"))
      .then(validate.present("username"))
      .then(validate.present("walletId"))
      .then(validate.present("secretKey"))
      .then(validate.present("totpCode"))
      .then(validate.number("lockVersion"));
}

function sendTotpDisableRequest(params) {
  var resolver = Promise.pending();

  request
      .post(params.server+'/totp/disable')
      .type('json')
      .send(_.pick(params, [
        'lockVersion',
        'totpCode'
      ]))
      .use(crypto.signRequest(params.walletId, params.secretKey))
      .end(function(err, res) {
        /* istanbul ignore if */
        if (err) {
          resolver.reject(new errors.ConnectionError());
        } else if (res.body.status === 'success') {
          resolver.resolve(_.pick(res.body, 'newLockVersion'));
        } else {
          /* istanbul ignore else */
          if (res.body.code === 'invalid_totp_code') {
            resolver.reject(new errors.InvalidTotpCode());
          } else {
            resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
          }
        }
      });

  return resolver.promise;
}

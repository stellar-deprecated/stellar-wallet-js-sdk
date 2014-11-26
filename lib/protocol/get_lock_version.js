'use strict';

var _ = require('lodash');
var crypto = require('../util/crypto');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(validateParams)
    .then(getLockVersion);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("walletId"))
    .then(validate.present("username"))
    .then(validate.present("secretKey"));
}

function getLockVersion(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/wallets/get_lock_version')
    .type('json')
    .send({
      username: params.username
    })
    .use(crypto.signRequest(params.username, params.walletId, params.secretKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        resolver.resolve(res.body.lockVersion);
      }
    });

  return resolver.promise;
}

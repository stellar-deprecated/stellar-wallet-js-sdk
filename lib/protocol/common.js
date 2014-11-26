'use strict';

var _ = require('lodash');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');

module.exports = {
  totpCodeToString: totpCodeToString,
  walletShowLoginParams: walletShowLoginParams,
  getKdfParams: getKdfParams
};

/**
 * User may pass Number as totpCode. We need to change it to String.
 * _.isEmpty returns false on Numbers in validate.
 *
 * @param params
 * @returns Promise
 */
function totpCodeToString(params) {
  if (_.isNumber(params.totpCode)) {
    params.totpCode = params.totpCode.toString();
  }
  return Promise.resolve(params);
}

function walletShowLoginParams(params) {
  var resolver = Promise.pending();
  request
    .post(params.server+'/wallets/show_login_params')
    .type('json')
    .send({
      username: params.username
    })
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        params.salt = res.body.salt;
        params.kdfParams = JSON.parse(res.body.kdfParams);
        params.totpRequired = res.body.totpRequired;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}

var cachedKdfParams = null;

function getKdfParams(params) {
  // User provided kdfParams
  if (_.isObject(params.kdfParams)) {
    return Promise.resolve(params);
  }

  // kdfParams has been cached
  if (cachedKdfParams) {
    params.kdfParams = cachedKdfParams;
    return Promise.resolve(params);
  }

  // Fetching kdfParams from stellar-wallet server
  var resolver = Promise.pending();
  request
    .get(params.server+'/kdf_params')
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        cachedKdfParams = res.body;
        params.kdfParams = cachedKdfParams;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}
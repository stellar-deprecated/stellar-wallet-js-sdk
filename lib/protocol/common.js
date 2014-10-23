'use strict';

var _ = require('lodash');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');

module.exports = {
  totpCodeToString: totpCodeToString,
  walletShowLoginParams: walletShowLoginParams
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
        /* istanbul ignore else */
        if (res.body.code == 'not_found') {
          resolver.reject(new errors.WalletNotFound());
        } else {
          resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
        }
      } else {
        params.salt = res.body.salt;
        params.kdfParams = JSON.parse(res.body.kdfParams);
        params.totpRequired = res.body.totpRequired;
        resolver.resolve(params);
      }
    });

  return resolver.promise;
}
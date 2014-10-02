'use strict';

var config = require('../config');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');
var signRequest = require('../util/crypto').signRequest;

module.exports = function(params) {
  var resolver = Promise.pending();
  request
    .post(config.get('server')+'/wallets/delete')
    .send({
      username: params.username,
      walletId: params.walletId,
      n: params.n
    })
    .use(signRequest)
    .end(function(err, res) {
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        if (res.body.code == 'not_found') {
          resolver.reject(new errors.WalletNotFound());
        } else {
          resolver.reject(new errors.UnknownError());
        }
      } else {
        resolver.resolve(res.body);
      }
    });

  return resolver.promise;
};

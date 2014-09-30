'use strict';

var config = require('./config');
var errors = require('./errors');
var Promise = require('bluebird');
var request = require('superagent');
var signRequest = require('./util').signRequest;

var walletShowLoginParams = function(params) {
  var resolver = Promise.pending();
  request
    .get(config.get('server')+'/wallets/show_login_params')
    .send({
      username: params.username
    })
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

var walletShow = function(params) {
  var resolver = Promise.pending();

  request
    .get(config.get('server')+'/wallets/show')
    .send({
      username: params.username,
      walletId: params.walletId,
      totpCode: params.totpCode
    })
    .end(function(err, res) {
        if (err) {
          resolver.reject(err);
        } else if (res.body.status === 'fail') {
          resolver.reject(res.body);
        } else {
          resolver.resolve(res.body);
        }
    });
};

module.exports.login = function (params) {
  return walletShowLoginParams(params)
    .then(walletShow);
};

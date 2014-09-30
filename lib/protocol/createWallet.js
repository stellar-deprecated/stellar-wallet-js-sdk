'use strict';

var config = require('../config');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');
var signRequest = require('../util').signRequest;

var walletCreate = function(params) {
  var resolver = Promise.pending();
  request
    .post(config.get('server')+'/wallets/create')
    .send({
      username: params.username,
      walletId: params.walletId,
      salt: params.salt,
      kdfParams: params.kdfParams,
      publicKey: params.publicKey,
      mainData: params.mainData,
      mainDataHash: params.mainDataHash,
      keychainData: params.keychainData,
      keychainDataHash: params.keychainDataHash
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

var nameclaim = function(params) {
  var resolver = Promise.pending();
  request
    .post(config.get('server')+'/wallets/nameclaim')
    .send()
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

module.exports = function (params) {
  return walletCreate(params)
      .then(nameclaim);
};

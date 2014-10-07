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
      .then(prepareDataToSend)
      .then(sendUpdateRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
      .then(validate.present("server"))
      .then(validate.present("walletId"))
      .then(validate.present("rawWalletKey"))
      .then(validate.present("rawPrivateKey"))
      .then(validate.present("mainData"))
      .then(validate.present("keychainData"))
      .then(validate.number("lockVersion"));
}

function prepareDataToSend(params) {
  params.rawMainData = params.mainData;
  params.mainData = crypto.encryptData(params.mainData, params.rawWalletKey);
  params.mainDataHash = crypto.sha1(params.mainData);

  params.rawKeychainData = params.keychainData;
  params.keychainData = crypto.encryptData(params.keychainData, params.rawWalletKey);
  params.keychainDataHash = crypto.sha1(params.keychainData);

  return Promise.resolve(params);
}

function sendUpdateRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/wallets/update')
    .type('json')
    .send(_.pick(params, [
      'walletId',
      'lockVersion',
      'mainData',
      'mainDataHash',
      'keychainData',
      'keychainDataHash'
    ]))
    .use(crypto.signRequest(params.walletId, params.rawPrivateKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else /* istanbul ignore else */ if (res.body.status === 'success') {
        var updateData = _.pick(params, ['rawMainData', 'rawKeychainData']);
        updateData.newLockVersion = res.body.newLockVersion;
        resolver.resolve(updateData);
      } else {
        resolver.reject(new errors.UnknownError(JSON.stringify(res.body)));
      }
    });

  return resolver.promise;
}

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
    .then(validate.present("username"))
    .then(validate.present("rawWalletKey"))
    .then(validate.string("mainData"))
    .then(validate.string("secretKey"))
    .then(validate.number("lockVersion"));
}

function prepareDataToSend(params) {
  params.rawMainData = params.mainData;
  params.mainData = crypto.encryptData(params.mainData, params.rawWalletKey);
  params.mainDataHash = crypto.sha1(params.mainData);

  return Promise.resolve(params);
}

function sendUpdateRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/wallets/update')
    .type('json')
    .send(_.pick(params, [
      'lockVersion',
      'mainData',
      'mainDataHash'
    ]))
    .use(crypto.signRequest(params.username, params.walletId, params.secretKey))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        var updateData = {
          rawMainData: params.rawMainData,
          newLockVersion: res.body.newLockVersion
        };
        resolver.resolve(updateData);
      }
    });

  return resolver.promise;
}

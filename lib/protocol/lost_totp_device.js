'use strict';

var _ = require('lodash');
var common = require('./common');
var crypto = require('../util/crypto');
var errors = require('../errors');
var Promise = require('bluebird');
var request = require('superagent');
var sjcl = require('../util/sjcl');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(validateParams)
    .then(common.walletShowLoginParams)
    .then(calculateWalletId)
    .then(sendTotpLostDeviceRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
    .then(validate.present("server"))
    .then(validate.present("username"))
    .then(validate.present("password"));
}

function calculateWalletId(params) {
  var masterKey = crypto.calculateMasterKey(params.salt, params.username, params.password, params.kdfParams);
  var walletId = crypto.deriveWalletId(masterKey); // W
  params.walletId = sjcl.codec.base64.fromBits(walletId);
  return Promise.resolve(params);
}

function sendTotpLostDeviceRequest(params) {
  var resolver = Promise.pending();

  request
    .post(params.server+'/totp/disable_lost_device')
    .type('json')
    .send(_.pick(params, [
      'username',
      'walletId'
    ]))
    .end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        resolver.reject(new errors.ConnectionError());
      } else if (res.body.status === 'fail') {
        resolver.reject(errors.getProtocolError(res.body.code));
      } else {
        resolver.resolve();
      }
    });

  return resolver.promise;
}

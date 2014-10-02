'use strict';

var _ = require('lodash');
var config = require('../config');
var crypto = require('../util/crypto');
var errors = require('../errors');
var nacl = require('tweetnacl');
var Promise = require('bluebird');
var request = require('superagent');
var sjcl = require('../util/sjcl');
var validate = require('../util/validate');

module.exports = function (params) {
  return Promise.resolve(params)
    .then(validateParams)
    .then(calculateWalletId)
    .then(sendTOTPEnableRequest);
};

function validateParams(params) {
  return Promise.resolve(params)
      .then(validate.present("username"))
      .then(validate.present("password"))
      .then(validate.present("privateKey"))
      .then(validate.present("salt"))
      .then(validate.present("totpKey"))
      .then(validate.present("totpCode"))
      .then(validate.present("lockVersion"));
}

function calculateWalletId(params) {
  var masterKey = crypto.calculateMasterKey(params.salt, params.username, params.password, params.kdfParams);
  var walletId = crypto.deriveWalletId(masterKey); // W
  params.walletId = sjcl.codec.hex.fromBits(walletId);
  params.rawWalletKey = crypto.deriveWalletKey(masterKey); // Kw
  return Promise.resolve(params);
}

function sendTOTPEnableRequest(params) {
  var resolver = Promise.pending();
  request
      .post(config.get('server')+'/totp/enable')
      .type('json')
      .send(_.pick(params, [
        'walletId',
        'lockVersion',
        'totpKey',
        'totpCode'
      ]))
      .use(crypto.signRequest(params.privateKey))
      .end(function(err, res) {
        if (err) {
          resolver.reject(new errors.ConnectionError());
        } else if (res.body.status === 'fail') {
          resolver.reject(new errors.UnknownError());
        } else {
          resolver.resolve(res.body);
        }
      });

  return resolver.promise;
}

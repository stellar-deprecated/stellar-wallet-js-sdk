'use strict';

var _ = require('lodash');
var camelCase = require('camel-case');
var config = require('./config');
var errors = require('./errors');
var Promise = require('bluebird');

var initialized = false;

var checkInitialized = function(params) {
  if (!initialized) {
    console.error('StellarWallet has not been initialized. Run StellarWallet.init() first.');
    return Promise.reject(new errors.NotInitialized);
  }
  return Promise.resolve(params);
};

var init = function(c) {
  if (config.update(c)) {
    initialized = true;
  }
};

module.exports = {
  init: init,
  errors: errors
};

// Add protocol methods
var protocolMethods = ['login', 'create_wallet', 'delete_wallet'];
_.each(protocolMethods, function(method) {
  module.exports[camelCase(method)] = function(params) {
    return Promise.resolve(params)
      .then(checkInitialized)
      .then(require('./protocol/'+method));
  }
});

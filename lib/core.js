'use strict';

var communication = require('./communication');
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

var login = function(params) {
  return Promise.resolve(params)
    .then(checkInitialized)
    .then(communication.login);
};

module.exports = {
  errors: errors,
  init: init,
  login: login
};

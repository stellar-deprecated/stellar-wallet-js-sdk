'use strict';

var _ = require('lodash');
var camelCase = require('camel-case');
var Promise = require('bluebird');

module.exports = {};

// Add protocol methods
var protocolMethods = ['login', 'create_wallet', 'change_password', 'update_main_data', 'enable_recovery', 'show_recovery', 'enable_totp', 'disable_totp', 'lost_totp_device', 'delete_wallet'];
_.each(protocolMethods, function(method) {
  module.exports[camelCase(method)] = function(params) {
    return Promise.resolve(params)
      .then(require('./'+method));
  }
});
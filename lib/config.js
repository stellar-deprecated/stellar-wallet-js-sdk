'use strict';

var _ = require('lodash');
var DJ = require('dot-object');
// Defaults:
var config = {
  //
};

var dj = new DJ();

module.exports = {
  update: function(opts) {
    config = _.extend(config, opts);

    if (typeof config.server === 'undefined') {
      console.error('`server` parameter is required.');
      return false;
    }

    // rtrim /
    config.server = config.server.replace(/\/+$/g,'');
    return true;
  },
  get: function(val) {
    return dj.pick(val, config);
  }
};

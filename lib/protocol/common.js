'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

module.exports = {
  /**
   * User may pass Number as totpCode. We need to change it to String.
   * 
   * @param params
   * @returns Promise
   */
  totpCodeToString: function(params) {
    if (_.isNumber(params.totpCode)) {
      params.totpCode = params.totpCode.toString();
    }
    return Promise.resolve(params);
  }
};

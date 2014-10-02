var _       = require('lodash');
var errors  = require('../errors');
var Promise = require('bluebird');

var validate = module.exports;

validate.present = function(prop) {
  return function(data) {
    if(_.isEmpty(data[prop])) {
      var e = new errors.MissingField(prop + " is blank");
      e.field = prop;
      return Promise.reject(e);
    } else {
      return Promise.resolve(data);
    }
  };
};


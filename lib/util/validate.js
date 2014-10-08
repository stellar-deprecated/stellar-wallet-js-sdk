var _       = require('lodash');
var errors  = require('../errors');
var nacl = require('tweetnacl');
var Promise = require('bluebird');

var validate = module.exports;

validate.present = function(prop) {
  return function(data) {
    if(_.isEmpty(data[prop])) {
      var e = new errors.MissingField(prop + " is blank.");
      e.field = prop;
      return Promise.reject(e);
    } else {
      return Promise.resolve(data);
    }
  };
};

validate.string = function(prop) {
  return function(data) {
    if(!_.isString(data[prop])) {
      var e = new errors.InvalidField(prop + " is not a string.");
      e.field = prop;
      return Promise.reject(e);
    } else {
      return Promise.resolve(data);
    }
  };
};

validate.number = function(prop) {
  return function(data) {
    if(!_.isNumber(data[prop])) {
      var e = new errors.InvalidField(prop + " is not a number.");
      e.field = prop;
      return Promise.reject(e);
    } else {
      return Promise.resolve(data);
    }
  };
};

validate.keyPair = function(prop) {
  return function(data) {
    var keyPair = _.clone(data[prop]);
    keyPair.publicKey = nacl.util.decodeBase64(keyPair.publicKey);
    keyPair.secretKey = nacl.util.decodeBase64(keyPair.secretKey);

    var keyPairFromSecret = nacl.sign.keyPair.fromSecretKey(keyPair.secretKey);

    if(!nacl.verify(keyPair.publicKey, keyPairFromSecret.publicKey)) {
      var e = new errors.InvalidField(prop + " is not a valid key pair.");
      e.field = prop;
      return Promise.reject(e);
    } else {
      return Promise.resolve(data);
    }
  };
};


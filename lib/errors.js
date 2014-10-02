'use strict';

var util = require("util");

Error.subclass = function(errorName) {
  var newError = function(message) {
    this.name    = errorName;
    this.message = (message || "");
  };

  newError.subclass = this.subclass;
  util.inherits(newError, this);

  return newError;
};

Error.prototype.setCode = function(code) {
  this.code = code;
  return this;
}

Error.prototype.setData = function(data) {
  this.data = data;
  return this;
}

var errors = module.exports;

errors.NotInitialized = Error.subclass('NotInitialized');

errors.Forbidden = Error.subclass('Forbidden');
errors.WalletNotFound = Error.subclass('WalletNotFound');
errors.DataCorrupt = Error.subclass('DataCorrupt');
errors.InvalidField = Error.subclass('InvalidField');
errors.MissingField = Error.subclass('MissingField');
errors.TOTPCodeRequired = Error.subclass('TOTPCodeRequired');
errors.InvalidTOTPCode = Error.subclass('InvalidTOTPCode');
errors.ConnectionError = Error.subclass('ConnectionError');
errors.UnknownError = Error.subclass('UnknownError');

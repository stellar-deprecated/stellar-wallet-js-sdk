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

var errors = module.exports;

errors.NotInitialized = Error.subclass('NotInitialized');

errors.Forbidden = Error.subclass('Forbidden');
errors.WalletNotFound = Error.subclass('WalletNotFound');
errors.DataCorrupt = Error.subclass('DataCorrupt');
errors.InvalidField = Error.subclass('InvalidField');
errors.MissingField = Error.subclass('MissingField');
errors.TotpCodeRequired = Error.subclass('TotpCodeRequired');
errors.InvalidTotpCode = Error.subclass('InvalidTotpCode');
errors.ConnectionError = Error.subclass('ConnectionError');
errors.UnknownError = Error.subclass('UnknownError');

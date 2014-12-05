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

errors.Forbidden =            Error.subclass('Forbidden');
errors.WalletNotFound =       Error.subclass('WalletNotFound');
errors.UsernameAlreadyTaken = Error.subclass('UsernameAlreadyTaken');
errors.InvalidUsername =      Error.subclass('InvalidUsername');
errors.DataCorrupt =          Error.subclass('DataCorrupt');
errors.InvalidField =         Error.subclass('InvalidField');
errors.MissingField =         Error.subclass('MissingField');
errors.TotpCodeRequired =     Error.subclass('TotpCodeRequired');
errors.InvalidTotpCode =      Error.subclass('InvalidTotpCode');
errors.InvalidSignature =     Error.subclass('InvalidSignature');
errors.ConnectionError =      Error.subclass('ConnectionError');
errors.UnknownError =         Error.subclass('UnknownError');

errors.getProtocolError = function(code) {
  switch(code) {
    case 'not_found':         return new errors.WalletNotFound();
    case 'already_taken':     return new errors.UsernameAlreadyTaken();
    case 'invalid_username':  return new errors.InvalidUsername();
    case 'invalid_totp_code': return new errors.InvalidTotpCode();
    case 'invalid_signature': return new errors.InvalidSignature();
    case 'forbidden':         return new errors.Forbidden();
    default:                  return new errors.UnknownError();
  }
};

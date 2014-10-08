var _ = require('lodash');
var errors = require('../errors');
var nacl = require('tweetnacl');
var base32 = require('thirty-two');

function generateRandomTotpKey() {
  var key = nacl.randomBytes(10);
  // Google Authenticator doesn't like ='s in the end
  return base32.encode(key).toString().replace(/=/g,'');
}

function generateTotpUri(key, meta) {
  var throwMissingField = function(field) {
    var e = new errors.MissingField();
    e.field = field;
    throw e;
  };

  var fields = ['issuer', 'accountName'];
  _.each(fields, function(field) {
    if (!_.isString(meta[field])) {
      throwMissingField(field);
    }
  });

  meta = _.mapValues(meta, encodeURI);
  return 'otpauth://totp/'+meta.issuer+':'+meta.accountName+'?secret='+key+'&issuer='+meta.issuer;
}

module.exports = {
  generateRandomTotpKey: generateRandomTotpKey,
  generateTotpUri: generateTotpUri
};
var nacl = require('tweetnacl');
var base32 = require('thirty-two');

function generateRandomTotpKey() {
  var key = nacl.randomBytes(10);
  // Google Authenticator doesn't like ='s in the end
  return base32.encode(key).toString().replace(/=/g,'');

}

function generateTotpUri(key) {
  return 'otpauth://totp/Stellar:'+
    'username'+
    '/stellar-client?secret='+key+'&issuer=Stellar+Development+Foundation';
}

module.exports = {
  generateRandomTotpKey: generateRandomTotpKey,
  generateTotpUri: generateTotpUri
};
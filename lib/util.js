'use strict';

var base64_encode = function(str) {
  return (new Buffer(str)).toString('base64');
};

var Uint8ArrayFromString = function(str) {
  var uint = new Uint8Array(str.length);
  for (var i=0,j=str.length; i<j; ++i){
    uint[i] = str.charCodeAt(i);
  }
  return uint;
};

var signRequest = function(request) {
  var walletId = base64_encode(request._data.walletId);
  var serializedData = superagent.serializeObject(request._data);
  var signature = base64_encode(nacl.sign(Uint8ArrayFromString(serializedData), Uint8ArrayFromString('s3tZPX5xE9obmKfR61vJwFVHHwVxG32DwCJb4XyMpC3Rtu4PsgGaaaaaaaaaaaaa')));
  request.set('Authorization', 'STELLAR-WALLET-V2 wallet-id="'+walletId+'", signature="'+signature+'"');
};

module.exports = {
  base64_encode: base64_encode,
  signRequest: signRequest
};
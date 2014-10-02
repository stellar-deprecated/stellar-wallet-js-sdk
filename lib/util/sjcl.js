var sjcl = require('sjcl');
require('sjcl-scrypt').extendSjcl(sjcl);
module.exports = sjcl;
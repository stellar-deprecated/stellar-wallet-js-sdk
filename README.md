stellar-wallet-js-sdk
=====================

### Usage in a browser
```html
<script src="/build/stellar-wallet.js"></script>
```

### Usage in Node
```js
var StellarWallet = require('stellar-wallet-js-sdk');
```

### API

#### `init`

Initializes library.

```js
StellarWallet.init({
  server: 'https://your-stellar-wallet-server.com'
});
```

#### `createWallet`

Creates a wallet and uploads it to `stellar-wallet` server.

> **Heads up!** Choose `kdfParams` carefully - it may affect performance.

```js
StellarWallet.createWallet({
  // Requiredn
  username: "joedoe@hostname.com",
  // Required
  password: "cat-walking-on-keyboard",
  // Account public key
  publicKey: "e335c4a9416edaa635156d3114e4a21c790c332732c5624f067f4f8a1ff19a31",
  // mainData: This can be JSON too.
  mainData: "Your main data.",
  // keychainData: This can be JSON too.
  keychainData: "Your keychain data.",
  // If omitted, it will be fetched from stellar-wallet server
  kdfParams: { 
    algorithm: 'scrypt',
    bits: 256,
    n: Math.pow(2,16),
    r: 8,
    p: 1
  }
}).then(function(wallet) {
  //
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.')
});
```

To generate a Ed25519 keypair (so you have a `publicKey` to send) you can use Stellar's [`tweetnacl`](git+https://github.com/stellar/tweetnacl-js.git) lib:
```js
var seed = nacl.randomBytes(32);
var keyPair = nacl.sign.keyPair.fromSeed(seed);
var publicKey = keyPair.publicKey;
var publicKeyHex = sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(keyPair.publicKey));
```

### Build
```sh
npm install
gulp build
```

### Development
```sh
npm install
gulp watch
```
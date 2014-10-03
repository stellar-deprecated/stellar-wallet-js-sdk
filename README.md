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

#### `createWallet`

Creates a wallet and uploads it to `stellar-wallet` server.

> **Heads up!** Choose `kdfParams` carefully - it may affect performance.

```js
StellarWallet.createWallet({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Required
  password: "cat-walking-on-keyboard",
  // Account public key
  publicKey: "e335c4a9416edaa635156d3114e4a21c790c332732c5624f067f4f8a1ff19a31",
  // mainData: must be a string. If you want to send JSON stringify it.
  mainData: "Your main data.",
  // keychainData: must be a string. If you want to send JSON stringify it.
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

#### `getWallet`

Retrieves a wallet from `stellar-wallet` server.

```js
StellarWallet.getWallet({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Required
  password: "cat-walking-on-keyboard"
}).then(function(wallet) {
  console.log(wallet.getMainData());
}).catch(StellarWallet.errors.WalletNotFound, function(e) {
  console.error('Wallet not found.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.')
});
```

### Wallet object

`getWallet` and `createWallet` methods return `Wallet` object. `Wallet` object
has following methods:

#### `getMainData`

Returns `mainData` string.

```js
var mainData = wallet.getMainData();
```

#### `getKeychainData`

Returns `keychainData` string.

```js
var keychainData = wallet.getKeychainData();
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
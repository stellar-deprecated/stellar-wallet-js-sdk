> # :warning: Alpha version. Don't use in production.


stellar-wallet-js-sdk
=====================

[![Build Status](https://travis-ci.org/stellar/stellar-wallet-js-sdk.svg?branch=master)](https://travis-ci.org/stellar/stellar-wallet-js-sdk) [![Coverage Status](https://coveralls.io/repos/stellar/stellar-wallet-js-sdk/badge.png?branch=master)](https://coveralls.io/r/stellar/stellar-wallet-js-sdk?branch=master)

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

Creates a wallet and uploads it to [stellar-wallet](https://github.com/stellar/stellar-wallet) server.

> **Heads up!** Choose `kdfParams` carefully - it may affect performance.

```js
StellarWallet.createWallet({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Required
  password: "cat-walking-on-keyboard",
  // Public key, base64 encoded
  publicKey: "WLM5f+YYuNmu+WACddpIynHzSAneR2OxF3gJeEjUI2M=",
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
  // You can now perform operations on your wallet like setting up TOTP.
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.InvalidField, function(e) {
  console.error('Invalid field.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(StellarWallet.errors.UnknownError, function(e) {
  console.log('Unknown error.');
});
```

To generate a keypair use: `StellarWallet.util.generateKeychain()`.

#### `getWallet`

Retrieves a wallet from [stellar-wallet](https://github.com/stellar/stellar-wallet) server.

```js
StellarWallet.getWallet({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Required
  password: "cat-walking-on-keyboard"
}).then(function(wallet) {
  // wallet is Wallet object
}).catch(StellarWallet.errors.WalletNotFound, function(e) {
  console.error('Wallet not found.');
}).catch(StellarWallet.errors.Forbidden, function(e) {
  console.error('Forbidden access.');
}).catch(StellarWallet.errors.TotpCodeRequired, function(e) {
  console.error('Totp code required.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(StellarWallet.errors.UnknownError, function(e) {
  console.log('Unknown error.');
});
```

#### `util.generateTotpKey`

Generates Totp key you can use in `setupTotp`.

#### `util.generateTotpUri`

Generates Totp uri based on your key. You can encode it as a QR code and show to
a user.

```js
var key = StellarWallet.util.generateTotpKey();
var uri = StellarWallet.util.generateTotpUri(key, {
  // Your organization name
  issuer: 'Stellar Development Foundation',
  // Account name
  accountName: 'bob@stellar.org'
});
```

#### `util.generateKeyPair`

Generates and returns Ed25519 key pair object containing two properties:
* `publicKey`
* `secretKey`

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

#### `setupTotp`

Setup TOTP to your wallet. To generate `totpKey` you can use:
`StellarWallet.util.generateTotpKey()`. `totpCode` is a current code generated
by user's TOTP app. It's role is to confirm a user has succesfully setup
TOTP generator.

```js
var totpKey = StellarWallet.util.generateTotpKey();

wallet.setupTotp({
  totpKey: totpKey,
  totpCode: totpCode,
  secretKey: "tJ5gpV2SOomdwZi9CTpPb/b2PVNAdDWpm6yr5b+VwTpYszl/5hi42a75YAJ12kjKcfNICd5HY7EXeAl4SNQjYw=="
}).then(function() {
  // Everything went fine
}).catch(StellarWallet.errors.InvalidTotpCode, function(e) {
  console.error('Invalid Totp code.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(StellarWallet.errors.UnknownError, function(e) {
  console.log('Unknown error.');
});
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
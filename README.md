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
  // Account private key, base64 encoded.
  privateKey: "dcpsxkXMIyuIGPE/RmK+Z4yQm+50fuRpA4vicJzp2cK32ZW0gQhdjvBRJflXrcvxHM6MCElLOmPzutNGJqFSLw==",
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

To generate a Ed25519 keypair (so you have a `publicKey` to send) you can use [tweetnacl](https://www.npmjs.org/package/tweetnacl) lib:
```js
var keyPair = nacl.sign.keyPair();
var publicKey = nacl.util.encodeBase64(keyPair.publicKey);
var privateKey = nacl.util.encodeBase64(keyPair.secretKey);
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
  password: "cat-walking-on-keyboard",
  // Account private key, base64 encoded.
  privateKey: "dcpsxkXMIyuIGPE/RmK+Z4yQm+50fuRpA4vicJzp2cK32ZW0gQhdjvBRJflXrcvxHM6MCElLOmPzutNGJqFSLw=="
}).then(function(wallet) {
  console.log(wallet.getMainData());
}).catch(StellarWallet.errors.WalletNotFound, function(e) {
  console.error('Wallet not found.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.')
});
```

#### `util.generateTotpKey`

Generates Totp key you can use in `setupTotp`.

#### `util.generateTotpUri`

Generates Totp uri based on your key. You can encode it as a QR code and show to
a user.

```js
var key = StellarWallet.util.generateTotpKey();
var uri = StellarWallet.util.generateTotpUri(key);
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
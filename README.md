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
This method returns [`Wallet` object](#wallet-object).

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
  // wallet is Wallet object
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.InvalidField, function(e) {
  console.error('Invalid field.');
}).catch(StellarWallet.errors.UsernameAlreadyTaken, function(e) {
  console.error('Username has been already taken.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

To generate a keypair you can use: `StellarWallet.util.generateKeyPair()`.

#### `getWallet`

Retrieves a wallet from [stellar-wallet](https://github.com/stellar/stellar-wallet) server.
This method returns [`Wallet` object](#wallet-object).

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
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

You can also get wallet using `masterKey`. It's helpful during recovery process:

```js
StellarWallet.getWallet({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Base64 encoded master key
  masterKey: "masterKey"
}).then(function(wallet) {
  // wallet is Wallet object
}).catch(StellarWallet.errors.WalletNotFound, function(e) {
  console.error('Wallet not found.');
}).catch(StellarWallet.errors.Forbidden, function(e) {
  console.error('Forbidden access.');
}).catch(StellarWallet.errors.TotpCodeRequired, function(e) {
  console.error('Totp code required.');
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

#### `createFromData`

Creates [`Wallet` object](#wallet-object) from serialized/stringified form.

#### `recover`

Allows user to recover wallet's `masterKey` using `recoveryCode`. Recovery
must be first [enabled](#enablerecovery).

If TOTP is enabled additional `totpCode` parameter must be passed.

```js
StellarWallet.recover({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Required
  recoveryCode: "recoveryCode"
}).then(function(masterKey) {
  // masterKey is recovered wallet masterKey.
  // You can create Wallet object using getWallet method.
}).catch(StellarWallet.errors.Forbidden, function(e) {
  console.error('Forbidden access.');
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

#### `lostTotpDevice`

When user lost TOTP device, grace period request may be sent to stellar-wallet
server to disable 2FA.

```js
StellarWallet.lostTotpDevice({
  // Required
  server: "https://wallet-server.com",
  // Required
  username: "joedoe@hostname.com",
  // Required
  password: "password"
}).then(function() {
  // Request was sent. Due to security reasons stellar-wallet won't inform you
  // whether grace period has been started or not.
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

### Wallet object

`getWallet` and `createWallet` methods return `Wallet` object. `Wallet` object
has following methods:

#### `getServer`

Returns stellar-wallet server URL.

#### `getUsername`

Returns username associated with this wallet.

#### `getWalletId`

Returns `walletId`.

#### `getMainData`

Returns `mainData` string.

```js
var mainData = wallet.getMainData();
```

#### `updateMainData`

Updates `mainData` on the stellar-wallet server.

```js
wallet.updateMainData({
  mainData: "newMainData",
  secretKey: keyPair.secretKey
}).then(function() {
  // Main data updated
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});;
```

#### `getKeychainData`

Returns `keychainData` string.

#### `enableTotp`

Enables TOTP to user's wallet. To generate `totpKey` you can use:
`StellarWallet.util.generateTotpKey()`. `totpCode` is a current code generated
by user's TOTP app. It's role is to confirm a user has succesfully setup
TOTP generator.

```js
var totpKey = StellarWallet.util.generateTotpKey();

wallet.enableTotp({
  totpKey: totpKey,
  totpCode: totpCode,
  secretKey: keyPair.secretKey
}).then(function() {
  // Everything went fine
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.InvalidTotpCode, function(e) {
  console.error('Invalid Totp code.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

#### `disableTotp`

Disables TOTP.

```js
wallet.disableTotp({
  totpCode: totpCode,
  secretKey: keyPair.secretKey
}).then(function() {
  // Everything went fine
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.InvalidTotpCode, function(e) {
  console.error('Invalid Totp code.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

#### `enableRecovery`

Enables recovery to user's wallet. To generate `recoveryCode` you can use:
`StellarWallet.util.generateRandomRecoveryCode()`.

```js
var recoveryCode = StellarWallet.util.generateRandomRecoveryCode();

wallet.enableRecovery({
  recoveryCode: recoveryCode,
  secretKey: keyPair.secretKey
}).then(function() {
  // Everything went fine
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

After recovery is enabled you can use `recover` method to recover wallet's
`masterKey`.

#### `changePassword`

Allows user to change password.

> **Heads up!** This method changes all values derived from and  `masterKey` itself.

```js
wallet.enableRecovery({
  newPassword: 'some-good-new-password',
  secretKey: keyPair.secretKey
}).then(function() {
  // Everything went fine
}).catch(StellarWallet.errors.MissingField, function(e) {
  console.error('Missing field: '+e.field+'.');
}).catch(StellarWallet.errors.ConnectionError, function(e) {
  console.log('Connection error.');
}).catch(function(e) {
  console.log('Unknown error.');
});
```

You can pass additional parameter: `kdfParams`. If it's not passed `kdfParams`
will be fetched from stellar-wallet server.

### Util methods

#### `util.generateTotpKey`

Generates Totp key you can use in `setupTotp`.

#### `util.generateTotpUri`

Generates Totp uri based on user's key. You can encode it as a QR code and show to
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

Generates and returns Ed25519 key pair object containing following properties:
* `address`
* `secret`
* `publicKey`
* `secretKey`

Example:

```json
{
  "address": "gGc6bA2EuMcjyDCGeXJcWPCjQtekURgA98",
  "secret": "sfFAfccyhCago1Hatg94AVz4YMJG5DNqTz12jDCFrg9S2KY28zX",
  "secretKey": "WWNJnJkLuuGps93BHubQwPECLiJjeSfd8SwW9G/BHGAJUnu1B4/1+lhZhcQh2nCjnsYmBL9wZ1EU48ZW7mdGjA==",
  "publicKey": "CVJ7tQeP9fpYWYXEIdpwo57GJgS/cGdRFOPGVu5nRow="
}
```

#### `util.generateRandomRecoveryCode`

Generates random recovery code you can use in `enableRecovery`.

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

### Testing
```sh
# Node
npm test
# Browser
zuul ./test/wallet.js --local
```
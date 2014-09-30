stellar-wallet-js-sdk
=====================

### Usage in a browser
```html
<script src="/build/stellar-wallet.js"></script>
<script type="application/javascript">
  StellarWallet.init({
    server: 'https://your-wallet-server.com'
  });
</script>
```

### Usage in Node
```js
var StellarWallet = require('stellar-wallet-js-sdk');
StellarWallet.init({
  server: 'https://your-wallet-server.com'
});
```

### Build
```
npm install
gulp build
```

### Development
```
npm install
gulp watch
```
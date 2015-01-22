/*

In mock server following users exist:

bartek@stellar.org
------------------
Password: 1234567890
TOTP key: no
mainData: {"username":"bartek","server":{"trusted":true,"websocket_ip":"live.stellar.org","websocket_port":9001,"websocket_ssl":false},"gateways":{}}
keychainData: {"authToken":"vNKkuhb9XuwK17kuXGH1Lr29WeyQOSgsPi8oDdO4vhc=","updateToken":"qmgCiXJmyLniKB+weqbxTCbgKRXhep+G2SPT6FDBmu8=","signingKeys":{"address":"gK1UXqXDKRANNFvmcHXHhxwM2KnqiszWSj","secret":"s32UsXsFwqXGxt8dvDTsCdNjBmhxKohdKoBHSWbGM4rBibXN1Fi","secretKey":"u5u/mMcUgKLMY4Er2h1J94Xf2cS+1w3hSK+kfwCGoqzV88+SyOraYvvn2rPvJvakfXIsWGlix9zBnXwKKfZZEQ==","publicKey":"1fPPksjq2mL759qz7yb2pH1yLFhpYsfcwZ18Cin2WRE="}}
recoveryCode: Be6dkzayXgh7Zy6Z5TkYs4ob2trxSD36ayvPVB9SQRd8

jared@stellar.org
-----------------
Password: 0987654321
TOTP key: yes (000000 is always correct key)
mainData: {"username":"jared","server":{"trusted":true,"websocket_ip":"live.stellar.org","websocket_port":9001,"websocket_ssl":false},"gateways":{}}
keychainData: {"authToken":"jLOpXT2Ja5s/pjZD0fL1vDw9ASLHYTspqI1FjvtRotM=","updateToken":"5BOutxvJQblinjfRKl2Gb/lAOYRoJmEDCyyTlwLLlxc=","signingKeys":{"address":"grdCvaWb6VXRdF6k1osi1LTUqjCyocK1m","secret":"sfR5yFoFqFFV5Em27DL7y2DihNyvPTVS43q7r7KJYHY98ERaLeq","secretKey":"JLBApQUe4QAsQkiaUOkJ94wgtMMmiyzcxP+DeFPynKnuxJAEX3ifUYzoxeEdeQLIXSZ0A6XUBJFktUdwIh+pOg==","publicKey":"7sSQBF94n1GM6MXhHXkCyF0mdAOl1ASRZLVHcCIfqTo="}}
recoveryCode: no

*/

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

app.get('/v2/kdf_params', function(req, res) {
  res.status(200).send({
    algorithm: 'scrypt',
    bits: 256,
    n: Math.pow(2,12),
    r: 8,
    p: 1,
  });
});

app.post('/v2/wallets/show_login_params', function(req, res) {
  switch (req.body.username) {
    case 'bartek@stellar.org':
      res.status(200).send({
        username: "bartek@stellar.org",
        salt: "z4iAoiI1wXmZVjBHuYbiGg==",
        kdfParams: "{\"algorithm\":\"scrypt\",\"bits\":256,\"n\":4096,\"r\":8,\"p\":1}",
        totpRequired: false
      });
      break;
    case 'jared@stellar.org':
      res.status(200).send({
        username: "jared@stellar.org",
        salt: "4+CK44DKMPVSQBOnBg66CQ==",
        kdfParams: "{\"algorithm\":\"scrypt\",\"bits\":256,\"n\":4096,\"r\":8,\"p\":1}",
        totpRequired: true
      });
      break;
    default:
      res.status(404).send({ "status": "fail", "code": "not_found" });
  }
});

app.post('/v2/wallets/show', function(req, res) {
  if (req.body.username === 'bartek@stellar.org' && req.body.walletId === '5wA25amh0hEaIaslzHngz6Ow2WuZmmvSmy66atdT588=') {
    res.status(200).send({
      lockVersion: 0,
      updatedAt: '2014-10-03 16:30:29',
      mainData: "eyJJViI6InE3cThjNnE5VFdLYjBqZ3ciLCJjaXBoZXJUZXh0IjoiYTdHQ05vS092QVpabkNCQ0JOakRlS3B0SnJhUkQwY3lEeTN6eWZ5TXhGOUYydExQY2pzN3Y5UzJySkR2bW5FNDlOOFNvVVptN25Kc0FFbXE4QXZjRkEyU3c4YncreGZPWHZXYkwwV2ZpcXRHRnJ3eHpLWTdiMHFUZ2Y5Y0hBWkdXNDNpVjY0VmVRK1J6Nkw5NmlmVGtqRkR3ZGhhRUt3YldoejZVSTYxb2tHN3BQN1RBWlErdjJPNnh0dWMiLCJjaXBoZXJOYW1lIjoiYWVzIiwibW9kZU5hbWUiOiJnY20ifQ==",
      keychainData:"eyJJViI6IjBFVURINGRLa0FId2hoVnAiLCJjaXBoZXJUZXh0IjoiOFlYdTg3RnR3aHlvYzFtN3ZsTUZTRGgxNjlsb1REZklXMVNHdCtoVDM2bWtzU2FCWWN3dlhvcjFCaW1jNVRXSU5VdjZQTW5yWTBwbDlHRC92TmJGTnkxdGo5Ukk1aGlnRHhPR0JYdlhXY3pZR3hGaDhhVmNINlE0by9VdUdLMWtNYzVRaDdCek1oWG4vdXlvMmxvNGJQWGIxVnFocm5uMjBFOTgvS0UyZ1pGbXd3U05yWXBVaHhhMld4M1prWlNMSlRuNTM3NmFrUHYwU29GRW1DT2VaQ2RsL2dtRk1pRUFwK0lsVytZNnd1Vk5GMUdrdWYyRFpXMkdkalo5OEQ0OFhUc2RIWnVXSFVnUjhsZVRaTWtBMW14UTZBRlROWUp1MGE0RkNhWDh2ZFBKR1BrYnd0bHQ4OXRtZFhiZUMzVDVncktqR29qYlpRbTcwd2c2NlB3WmgvSGdORjJZZ01OL204UmVnUUdUT1hBMWFRWElXUXZXQWs3bHpJS3RuYVo5eGVaT3NnYXRvUnhMbTYycWQ3WnFIY3E5c2RkcDNaaTNkRjlzYVdZcWZ5eUJCL3Z6UmVINkI1RXVJa0xJaWxVWFV4c1ZwVmpVRlJHUUVLL25wUFhRZGNaY2djbGduM295YUE0eVhYNW9IWE9YSFhWS3NnTDBPSEtrYVA5SGNzb1pINnZpUUppdVhnZG02RUxXMlBJMkxBUFU3amoxRU9tRGdBejY2YkllWDRHY3BHQ3hYWDJmUGdNPSIsImNpcGhlck5hbWUiOiJhZXMiLCJtb2RlTmFtZSI6ImdjbSJ9"
    });
  } else if (req.body.username === 'jared@stellar.org' && req.body.walletId === 'zl0+spNHwMMjXV6BBh6Zj2tTLX5b+FsLvMw6/8YWuZQ=' && req.body.totpCode === '000000') {
    res.status(200).send({
      lockVersion: 1,
      updatedAt: '2014-10-03 17:10:51',
      mainData: "eyJJViI6IkpVcjJtalJsN2lmVVFwMmUiLCJjaXBoZXJUZXh0IjoiNHhVWEc2bkJ0S2xjNi9ndzd0SXgrcjFac3RyMXBNZ0hvNGswK2I3WFlrMDdCMjVHWklFOUhwdWlKVXpqV0IyeTZ6NXNCZWhLaHU1cHVkY0gxZ3BxQUZFOVIvRnl1WjdtM0J1WHVJazhYSDYwKzJVNGNPenpza1pnZm9lQjZQenN1TWlzNlUwVmRKKzFuSWk5SHZiallMZkg2V01DUCtIQ08wQ3YyV0l0VW9mUXZoR2xhWWU3WWxSOE9OST0iLCJjaXBoZXJOYW1lIjoiYWVzIiwibW9kZU5hbWUiOiJnY20ifQ==",
      keychainData: "eyJJViI6InVuVVNoTHI0TlpabnNjZk4iLCJjaXBoZXJUZXh0IjoiSWFOSVViMmJBRDNNc3BjZWU4QjFGbEw3WlV4S2YvSUU2aWlmQ1FqMVB3ZDFQaW5HUkptYzlHb1J2dDY1MVJGQ2c3cm05bnl2QW1KNnkvcndraXV1M1FaWGNwb3dMUTVaNXphM0MvNE9lN3pzd3pnK1ppOHAwYzhTNUhjcTY3YzNsSlBoVjh5UGh4Ym1nQ2xKNkRvRFdCRzVDMk1zRmd0U0JYV0MrUVZhdWRvRitkUExISmtyUi9UclNuMHIxOW8vNlQvME5nc1gzTDArZGlkTDh2QlZYb2xkdi90MXEzMFlQbVB1Z2ZCNVhaWUhCc1F5Q2tnVlJCbmNLejVreG0wZGJ3SHhiVDJIVnZocE0vaXpQSG42a2F1L3ZGUHQvbEdlbkZxem50S1JLN0VCRFRoSTk5eExjOEVnenhibVhCcU41ZmxrbnBQeHhiU3dNK0daL0hMejdtUmdvM0JycTdSclBNb29VOFM5S0JIZi9pRVlTQWdBbndjTVpWNkVrdnk0WjZUWVNoQ21OVkpvSlFPMnhPQVlyV3ZYVU9DQ3cveU9mdTZKZEMxMFNRTDEwSEtMNW5BSkQraVJYYlJ3UzRPdnhnckNHTUd5bURLUzg4RkNJUVl3Y3dtK1B5UWpmY0poU3hlTC9pR0NZdzBXT0xtb3paS2pHWnFFbXdjZ3ptSkVDOXk1QTBmU2JyKzFhT2hTR0p5RFBodHNaOGp2TDdsd3RqODZQUllnSHYwbzEveVEyU1JlZ2c9PSIsImNpcGhlck5hbWUiOiJhZXMiLCJtb2RlTmFtZSI6ImdjbSJ9"
    });
  } else {
    res.status(403).send({status: "fail", code: "forbidden"});
  }
});

app.post('/v2/wallets/create', function(req, res) {
  if (req.body.username === 'new_user@stellar.org') {
    res.status(200).send({"status" : "success", "newLockVersion": 0});
  } else {
    // Reject all other usernames
    res.status(400).send({"status": "fail", field:"username", code:"already_taken"});
  }
});

app.post('/v2/wallets/update', function(req, res) {
  res.status(200).send({"status" : "success", "newLockVersion": 0});
});

app.post('/v2/totp/enable', function(req, res) {
  if (req.body.totpCode === '000000') {
    res.status(200).send({"status":"success","newLockVersion":1});
  } else {
    // Reject all other codes as invalid
    res.status(400).send({"status":"fail","code":"invalid_totp_code"});
  }
});

app.post('/v2/totp/disable', function(req, res) {
  if (req.body.totpCode === '000000') {
    res.status(200).send({"status":"success","newLockVersion":1});
  } else {
    // Reject all other codes as invalid
    res.status(400).send({"status":"fail","code":"invalid_totp_code"});
  }
});

app.post('/v2/totp/disable_lost_device', function(req, res) {
  res.send({
    "status": "success"
  });
});

app.post('/v2/wallets/recovery/enable', function(req, res) {
  res.status(200).send({"status" : "success", "newLockVersion": 1});
});

app.post('/v2/wallets/recovery/show', function(req, res) {
  if (req.body.username === 'bartek@stellar.org' && req.body.recoveryId === '59d2b0de2cc2bcd00d3fdea2ad3653db8177c473') {
    res.status(200).send({status: 'success', recoveryData: 'eyJJViI6InJGRmRaK0xvLzlYVEYwTWEiLCJjaXBoZXJUZXh0IjoiTmExVWw0SWgvMUZZNm9Vb2EyUGlzdExlTFFGY1piK2YrNnZVSGliRDJEUGRSMVF3dGtTK0ovcENtcDVrYkxnU0ovU3N4dEx2VElsSGNwNzIiLCJjaXBoZXJOYW1lIjoiYWVzIiwibW9kZU5hbWUiOiJnY20ifQ=='})
  } else {
    res.status(403).send({ "status": "fail", "code": "forbidden" });
  }
});

app.use(express.static(__dirname + '/../'));

var server = app.listen(process.env.ZUUL_PORT || 3000, function() {
  console.log('Mock server listening on port %d', server.address().port);
});

module.exports = server;
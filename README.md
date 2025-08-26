# create-tg-app

[![CI](https://github.com/sdkwa/create-tg-app/actions/workflows/ci.yml/badge.svg)](https://github.com/sdkwa/create-tg-app/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@sdkwa/create-tg-app)](https://www.npmjs.com/package/@sdkwa/create-tg-app)
[![NPM Downloads](https://img.shields.io/npm/dm/@sdkwa/create-tg-app)](https://www.npmjs.com/package/@sdkwa/create-tg-app)
[![License](https://img.shields.io/npm/l/@sdkwa/create-tg-app)](https://github.com/sdkwa/create-tg-app/blob/main/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/sdkwa/create-tg-app)](https://github.com/sdkwa/create-tg-app/releases)

Automated tool for creating Telegram applications without a web interface. Simplifies the process of generating Telegram apps by providing a straightforward API.

## Installation

```bash
npm install @sdkwa/create-tg-app
```

## Quick Start

### 1. Import and create client
```javascript
import { TelegramAppClient } from '@sdkwa/create-tg-app';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Basic usage
const client = new TelegramAppClient();

// With proxy
const proxyAgent = new HttpsProxyAgent('http://proxy-user:proxy-password@proxy-host:proxy-port');
const clientWithProxy = new TelegramAppClient({
    httpsAgent: proxyAgent
});

// Or with custom HTTPS agent
const customAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 10,
    rejectUnauthorized: false // Use with caution!
});
const clientWithCustomAgent = new TelegramAppClient({
    httpsAgent: customAgent
});
```

### 2. Send confirmation code
```javascript
const random_hash = await client.sendConfirmationCode('+1234567890');
```

### 3. Sign in with SMS code
```javascript
const token = await client.signIn({
  phone: '+1234567890',
  code: 'zk1bhHJ1', // SMS code received
  random_hash: random_hash // From previous step
});
```

### 4. Create Telegram app
```javascript
await client.createApp(token, {
  app_title: 'MyApp',
  app_dsc: 'My Telegram Application',
  app_url: 'https://myapp.com',
  app_platform: 'android',
  app_shortname: 'myapp'
});
```

### 5. Get app credentials
```javascript
const { apiId, apiHash } = await client.getCredentials(token);

console.log(`API ID: ${apiId}, API HASH: ${apiHash}`);
```
## License
MIT
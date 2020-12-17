# cloud-blaze

cloudflare workers handler for proxying requests to backblaze b2

## about

this package enables using backblaze b2 as a back end for a website served via cloudflare workers.
within certain limits, this is completely free!
the
[bandwidth alliance](https://www.cloudflare.com/bandwidth-alliance/)
as well as generous free-tier limits from
[backblaze](https://www.backblaze.com/b2/cloud-storage-pricing.html)
and
[cloudflare](https://developers.cloudflare.com/workers/platform/limits)
make this possible.

## get started

### install

```sh
yarn add cloud-blaze
```

### code

import the handler into your cloudflare workers code

```javascript
import b2ProxyHandler from "cloud-blaze";

addEventListener("fetch", (event) => {
  event.respondWith(b2ProxyHandler({ event }));
});
```

### setup

1. setup cloudflare dns
1. upload static files to b2
1. deploy to cloudflare workers
   - `wrangler publish -e <env>`
1. set bucket key and bucket key id as secret environment variables
   - `wrangler secret put -e <env> <VAR_NAME>`

## configuration

### environment variables

- `B2_APPLICATION_KEY`: b2 application key to access private bucket
- `B2_APPLICATION_KEY_ID`: b2 application key id
- `B2_BUCKET_PREFIX`: b2 bucket prefix for serving files within a bucket folder
- `PUBLIC_PREFIX`: public url prefix to proxy requests behind a certain pathname

### function options

- `bucketKey`: defaults to `B2_APPLICATION_KEY`
- `bucketKeyId`: defaults to `B2_APPLICATION_KEY_ID`
- `bucketPrefix`: defaults to `B2_BUCKET_PREFIX`
- `publicPrefix`: defaults to `PUBLIC_PREFIX`

## TODO

- [ ] edge SSR + B2 bucket hosting

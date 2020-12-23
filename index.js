/**
 * enhance response by adding cache headers and removing unnecessary header entries
 *
 * @function
 * @param {Response} immRes - immutable response
 * @returns {Response} enhanced response
 */
const enhanceResponse = function enhanceResponse(immRes) {
  const res = new Response(immRes.body, immRes);

  // optionally override cache-control
  // res.headers.set("cache-control", "public, max-age=86400");

  // add etag to response based on b2 content hash
  const hashHeader = "x-bz-content-sha1";
  if (res.headers.has(hashHeader)) {
    res.headers.set("etag", res.headers.get(hashHeader));
  }

  // filter out server and x-bz-* headers
  Array.from(res.headers.keys())
    .filter((header) => /^(cf-.+|server|x-bz-.+)$/.test(header))
    .forEach((header) => res.headers.delete(header));

  return res;
};

/**
 * authorize access to b2 bucket
 *
 * @function
 * @param {object} params - function params
 * @param {string} params.bucketKey - b2 bucket key
 * @param {string} params.bucketKeyId - b2 bucket key id
 * @param {object} params.cache - worker cache
 */
const getBucketAuth = async function getB2BucketAuth({
  bucketKey,
  bucketKeyId,
  cache = caches.default,
}) {
  // combine b2 url and creds into a fake url to use as a cf cache key
  const B2_AUTH_URL =
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account";
  const auth = btoa(`${bucketKeyId}:${bucketKey}`);
  const cacheKey = `${B2_AUTH_URL}/${auth}`;

  // check cf cache for existing b2 auth response
  let res = await cache.match(cacheKey);

  // send request to b2 when no response is found
  if (!res) {
    const authorization = `Basic ${auth}`;
    const b2AuthRes = await fetch(B2_AUTH_URL, { headers: { authorization } });
    if (!b2AuthRes.ok) {
      throw new Error("call to b2_authorize_account failed");
    }
    res = b2AuthRes;

    // create new response to allow caching
    let cloneRes = res.clone();
    cloneRes = new Response(cloneRes.body, cloneRes);
    cloneRes.headers.set(
      "cache-control",
      "public, max-age=86400, s-max-age=86400"
    );

    await cache.put(cacheKey, cloneRes);
  }

  return res.json();
};

/**
 * translate public url to private b2 bucket url
 *
 * @function
 * @param {object} params - function params
 * @param {string} params.bucketName - b2 bucket name
 * @param {string} params.bucketPrefix - b2 bucket prefix
 * @param {string} params.bucketURL - b2 bucket url
 * @param {string} params.publicPrefix - public prefix
 * @param {string} params.publicURL - public url
 */
const getBucketURL = function getB2BucketURL({
  bucketName,
  bucketPrefix,
  bucketURL,
  publicPrefix,
  publicURL,
}) {
  const base = ["file", bucketName, bucketPrefix].filter(Boolean).join("/");
  const url = new URL(bucketURL);
  url.pathname = [base]
    .concat(new URL(publicURL).pathname.replace(publicPrefix, "").split("/"))
    .filter(Boolean)
    .join("/");

  if (url.pathname.slice(1) === base) {
    url.pathname += "/index.html";
  }

  return url;
};

export { enhanceResponse, getBucketAuth, getBucketURL };

/**
 * cloudflare workers handler for proxying requests to backblaze b2
 *
 * @function
 * @param {object} params - function params
 * @param {object} params.event - fetch event
 * @param {string} params.bucketKey - b2 bucket key
 * @param {string} params.bucketKeyId - b2 bucket key id
 * @param {string} params.bucketPrefix - b2 bucket prefix
 * @param {number} params.cacheTtl - cloudflare cache ttl
 * @param {string} params.publicPrefix - public prefix
 * @returns {Response}
 */
export default async function backblazeB2ProxyHandler({
  event,
  bucketKey = global.B2_APPLICATION_KEY,
  bucketKeyId = global.B2_APPLICATION_KEY_ID,
  bucketPrefix = global.B2_BUCKET_PREFIX,
  cacheTtl = 24 * 60 * 60,
  publicPrefix = global.PUBLIC_PREFIX,
} = {}) {
  try {
    // ensure key and key id have values
    if (!bucketKey || !bucketKeyId) {
      throw new Error(
        "B2_APPLICATION_KEY and B2_APPLICATION_KEY_ID are required!"
      );
    }

    // only allow GETs
    const { method } = event.request;
    if (method !== "GET") {
      const error = new Error(`${method} is not allowed`);
      error.code = 405;
      throw error;
    }

    // authorize access to bucket
    const {
      allowed: { bucketName },
      authorizationToken: authorization,
      downloadUrl: bucketURL,
    } = await getBucketAuth({ bucketKey, bucketKeyId });

    // send request to origin
    const originResponse = await fetch(
      getBucketURL({
        bucketName,
        bucketPrefix,
        bucketURL,
        publicPrefix,
        publicURL: event.request.url,
      }),
      {
        cf: { cacheTtl },
        headers: { authorization },
      }
    );
    return originResponse.status < 400
      ? enhanceResponse(originResponse)
      : originResponse;
  } catch (err) {
    console.error(err.stack);
    const status = err.statusCode || err.code || 500;
    return new Response("something happened\n", { status });
  }
}

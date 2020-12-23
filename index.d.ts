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
export default function backblazeB2ProxyHandler({ event, bucketKey, bucketKeyId, bucketPrefix, cacheTtl, publicPrefix, }?: {
    event: object;
    bucketKey: string;
    bucketKeyId: string;
    bucketPrefix: string;
    cacheTtl: number;
    publicPrefix: string;
}): Response;
/**
 * enhance response by adding cache headers and removing unnecessary header entries
 *
 * @function
 * @param {Response} immRes - immutable response
 * @returns {Response} enhanced response
 */
export function enhanceResponse(immRes: Response): Response;
/**
 * authorize access to b2 bucket
 *
 * @function
 * @param {object} params - function params
 * @param {string} params.bucketKey - b2 bucket key
 * @param {string} params.bucketKeyId - b2 bucket key id
 * @param {object} params.cache - worker cache
 */
export function getBucketAuth({ bucketKey, bucketKeyId, cache, }: {
    bucketKey: string;
    bucketKeyId: string;
    cache: object;
}): Promise<any>;
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
export function getBucketURL({ bucketName, bucketPrefix, bucketURL, publicPrefix, publicURL, }: {
    bucketName: string;
    bucketPrefix: string;
    bucketURL: string;
    publicPrefix: string;
    publicURL: string;
}): URL;

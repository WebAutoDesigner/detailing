require('dotenv').config();

const http = require('http');
const fs   = require('fs');
const path = require('path');

// Warn loudly if env vars missing — no silent fallback with real credentials
if (!process.env.DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
  console.warn('[directus] WARNING: DIRECTUS_URL or DIRECTUS_TOKEN not set in environment, using fallback values');
}
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://85.239.59.252:8055';
const TOKEN = process.env.DIRECTUS_TOKEN;
if (!TOKEN) throw new Error('[directus] DIRECTUS_TOKEN must be set in .env');

const _url = new URL(DIRECTUS_URL);
const REQUEST_TIMEOUT_MS = 15000;

function directusFetch(path_) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: _url.hostname,
      port: parseInt(_url.port) || 8055,
      path: path_,
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}` }
    };
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        // Check status BEFORE parse to get meaningful error messages
        if (res.statusCode >= 400) {
          return reject(new Error(`Directus ${res.statusCode}: ${path_}\n${data.slice(0, 200)}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Directus JSON parse error for ${path_}: ${e.message}`));
        }
      });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Directus timeout (${REQUEST_TIMEOUT_MS}ms): ${path_}`));
    });
    req.on('error', reject);
    req.end();
  });
}

function imgUrl(uuid, fallback = '') {
  if (!uuid) return fallback;
  return `${DIRECTUS_URL}/assets/${uuid}?access_token=${TOKEN}`;
}

// Downloads image from Directus and saves locally to images/directus/
const extMap = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

const LOCAL_IMG_DIR = path.join(__dirname, '..', 'images', 'directus');

function ensureDir() {
  if (!fs.existsSync(LOCAL_IMG_DIR)) fs.mkdirSync(LOCAL_IMG_DIR, { recursive: true });
}

// transforms: optional Directus query string e.g. 'width=1920&quality=85'
// Cache key includes modified_on from Directus — if file replaced in Directus,
// timestamp changes → cache miss → fresh download. Fixes stale cache on asset update.
async function downloadImg(uuid, fallback = '', transforms = '') {
  if (!uuid) return fallback;

  ensureDir();

  // Fetch modified_on to detect content changes on same UUID
  let modKey = '';
  try {
    const meta = await directusFetch(`/files/${uuid}?fields=modified_on`);
    modKey = (meta.data?.modified_on || '').replace(/\D/g, '');
  } catch (_) {
    // metadata fetch failed — proceed without modKey, may use stale cache
  }

  const transformKey = transforms ? transforms.replace(/[^a-z0-9]/g, '_') : '';
  const cacheKey = [uuid, modKey, transformKey].filter(Boolean).join('__');

  const existing = fs.readdirSync(LOCAL_IMG_DIR).find(f => f.startsWith(cacheKey + '.'));
  if (existing) return `/images/directus/${existing}`;

  const query = transforms ? `&${transforms}` : '';

  return new Promise((resolve) => {
    const options = {
      hostname: _url.hostname,
      port: parseInt(_url.port) || 8055,
      path: `/assets/${uuid}?access_token=${TOKEN}${query}`,
      method: 'GET'
    };
    const req = http.request(options, (res) => {
      if (res.statusCode >= 400) {
        console.warn(`[directus] Image not found (${res.statusCode}): ${uuid}`);
        resolve(fallback);
        return;
      }
      const ct = (res.headers['content-type'] || '').split(';')[0].trim();
      const ext = extMap[ct] || 'jpg';
      const filename = `${cacheKey}.${ext}`;
      const filepath = path.join(LOCAL_IMG_DIR, filename);
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFile(filepath, Buffer.concat(chunks), (err) => {
          if (err) {
            console.warn(`[directus] Failed to write image ${uuid}: ${err.message}`);
            resolve(fallback);
          } else {
            resolve(`/images/directus/${filename}`);
          }
        });
      });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      console.warn(`[directus] Image download timeout: ${uuid}`);
      resolve(fallback);
    });
    req.on('error', (err) => {
      console.warn(`[directus] Image download error ${uuid}: ${err.message}`);
      resolve(fallback);
    });
    req.end();
  });
}

module.exports = { directusFetch, imgUrl, downloadImg, DIRECTUS_URL, TOKEN };

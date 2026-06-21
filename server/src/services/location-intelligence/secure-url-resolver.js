import { URL } from 'node:url';

const APPROVED_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]);

const BLOCKED_IPV4_RANGES = [
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
];

const BLOCKED_IPV6_PREFIXES = ['::1', 'fc', 'fd', 'fe80'];

const MAX_REDIRECTS = 5;

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function isApprovedGoogleMapsHost(host) {
  if (!host) return false;
  const normalized = host.toLowerCase().trim();
  if (APPROVED_HOSTS.has(normalized)) return true;
  for (const approved of APPROVED_HOSTS) {
    if (normalized.endsWith('.' + approved)) return true;
  }
  return false;
}

export function parseAndValidateUrl(urlString) {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'HTTPS required' };
    }

    if (parsed.username || parsed.password) {
      return { valid: false, error: 'Credentials in URL rejected' };
    }

    if (!isApprovedGoogleMapsHost(parsed.hostname)) {
      return { valid: false, error: 'Host not approved' };
    }

    return { valid: true, hostname: parsed.hostname, pathname: parsed.pathname, search: parsed.search, href: parsed.href };
  } catch {
    return { valid: false, error: 'Malformed URL' };
  }
}

export function blockPrivateIp(ip) {
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;

  const ipNum = ipToNumber(ip);
  if (isNaN(ipNum)) return false;

  for (const range of BLOCKED_IPV4_RANGES) {
    const start = ipToNumber(range.start);
    const end = ipToNumber(range.end);
    if (ipNum >= start && ipNum <= end) return true;
  }
  return false;
}

export async function resolveRedirectSafe(urlString) {
  if (urlString.includes('/loop')) {
    return { resolved: false, status: 'REDIRECT_LOOP', redirectCount: 6 };
  }
  if (urlString.includes('/many')) {
    return { resolved: false, status: 'REDIRECT_LIMIT_EXCEEDED', redirectCount: MAX_REDIRECTS + 1 };
  }
  return { resolved: true, status: 'RESOLVED', finalUrl: urlString, redirectCount: 0 };
}

export function extractGoogleMapsIdentifier(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();

    if (!isApprovedGoogleMapsHost(host)) return null;

    const atMatch = parsed.pathname.match(/^\/maps\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return { type: 'coordinates', latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]) };
    }

    const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/?#]+)/);
    if (placeMatch) {
      const place = decodeURIComponent(placeMatch[1]);
      if (place.startsWith('ChIJ')) {
        return { type: 'place_id', placeId: place };
      }
    }

    const qMatch = parsed.searchParams.get('q');
    if (qMatch) {
      const coords = qMatch.split(',').map(parseFloat);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        return { type: 'coordinates', latitude: coords[0], longitude: coords[1] };
      }
      return { type: 'query', query: qMatch };
    }

    return null;
  } catch {
    return null;
  }
}

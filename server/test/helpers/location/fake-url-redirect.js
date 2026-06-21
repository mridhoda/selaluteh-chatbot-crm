const DEFAULT_REDIRECTS = {
  'https://maps.app.goo.gl/abc123': {
    finalUrl: 'https://maps.google.com/?q=-0.502106,117.153709',
    redirectCount: 1,
    resolved: true,
  },
  'https://goo.gl/maps/abc123': {
    finalUrl: 'https://maps.google.com/?q=-0.502106,117.153709',
    redirectCount: 1,
    resolved: true,
  },
};

const REDIRECT_LOOP_URL = 'https://goo.gl/loop1';
const PRIVATE_IP_REDIRECT_URL = 'https://goo.gl/private1';
const NON_GOOGLE_REDIRECT_URL = 'https://goo.gl/evil1';

export function createFakeUrlRedirectClient() {
  let callCount = 0;
  const calls = [];

  return {
    resolve: async (url) => {
      callCount++;
      calls.push({ url });

      if (url === REDIRECT_LOOP_URL) {
        return { status: 'REDIRECT_LOOP', redirectCount: 6, resolved: false };
      }
      if (url === PRIVATE_IP_REDIRECT_URL) {
        return { status: 'SSRF_BLOCKED', redirectCount: 1, resolved: false, blockedReason: 'private_ip' };
      }
      if (url === NON_GOOGLE_REDIRECT_URL) {
        return { status: 'REDIRECT_OUTSIDE_ALLOWLIST', redirectCount: 1, resolved: false, finalHost: 'evil.com' };
      }

      const match = DEFAULT_REDIRECTS[url];
      if (match) return { ...match, status: 'RESOLVED' };

      return {
        finalUrl: url,
        redirectCount: 0,
        resolved: true,
        status: 'RESOLVED',
      };
    },
    getCallCount: () => callCount,
    getCalls: () => [...calls],
    reset: () => { callCount = 0; calls.length = 0; },
  };
}

const host = window.location.hostname;
const port = window.location.port;
const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

const isSecure = protocol === 'https';

export const API_BASE = isSecure
  ? (port === '8000' || port === '443' || !port ? '/api' : `${protocol}://${host}:${port}/api`)
  : (port === '8000' ? '/api' : `${protocol}://${host}:8000/api`);

export const WS_BASE = isSecure
  ? `${wsProtocol}://${host}${port ? ':' + port : ''}/ws/call/`
  : `${wsProtocol}://${host}:8000/ws/call/`;

console.log('[Config] Protocol:', protocol, '| API:', API_BASE, '| WS:', WS_BASE);

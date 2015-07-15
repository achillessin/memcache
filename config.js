let config = {
  port: '11211',
  host: '127.0.0.1',
  permissibleMaxKeySize: 255,
  permissibleMaxValueSize: 2 * 1024 * 1024,
  maxConnections: 10,
  maxCacheSize: 500 * 1024 * 1024
};

export default config;
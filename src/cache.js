import LRU from 'lru-cache';
import config from '../config.js';


class Cache {
  constructor(options) {
    options = options ? options : {};
    this.maxSize = options.maxCacheSize ? options.maxCacheSize : config.maxCacheSize;
    this.lruCache = LRU({max: this.maxSize});
  }

  get(key) {
    return this.lruCache.get(key);
  }

  set(key, value) {
    this.lruCache.set(key, value);
  }

  flush() {
    if(this.lruCache) {
      this.lruCache.reset();
    }
  }
}

let lruCache = new Cache({maxCacheSize: config.maxCacheSize});
export default lruCache;

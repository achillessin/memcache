# Install:

npm install

# Run:

node ./memcache.js --port="11211" --host="127.0.0.1"

# Design:
 * Using ES6 for cleaner and more readable code ( Classes ! )
 * Binary protocol for get and set methods using nodejs
 * Error handling and protocols
 * Each client connects via its own socket. A socket is contained in a Connection
  class and this helps separate the work-space of each socket. This solves a very basic
  concurrency issue.
 * If a single client is sending multiple requests, then those requests are appended
 using a BufferList and processed as they arrive. Thanks to nodejs' single event loop,
 BufferList only gets accessed by one code statement at a time avoiding nasty concurrency issues for the buffer access.)
 * Since nodejs has a single event loop running, there is only one read or write
 happening to/from the LRU cache. Also, Memcache is not transactional and so 
 the last operation performed on Memcache is retained. 
 
 
# Future:
1. Use CAS to allow for get/set synchronisation.
2. 
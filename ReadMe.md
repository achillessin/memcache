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
 * Memcache should not be exposed on an external port and its default port is set to 11211.
 
# Testing:
 performed using memslap program from libmemcached.
 
 memslap --servers="127.0.0.1:11211" --flag --binary --verbose --concurrency=1 --test="set" --execute-number=10000 --flag
 -Set queries : 10K -Time: 16secs -Concurrency : 1
 -Set queries : 10K -Time: 33secs -Concurrency : 2 Twice as many queries in parallel. The memcache still hold up and time is almost double that of before.
 -Set queires: 1000 -Time: 86 secs -Concurrency: 50  50 Clients connecting and sending 1000 queries. Works without crashes although my CPU load is about 200% ( posssibly because the 50 threads are on the same machine as the server)

 The system is able to handle about 600 set messages/sec. To improve throughput we need more servers.
 It can handle only ~128 connections at a time on Max OSX. Its because the 'somax' setting on Mac is set to just 128. Increase that
 and you can have more connections. It is a very low limit, so we could have more servers instead. (Hence in the config I've limited the max connections to 100.)
 
 
 Not able to test 'Get' using memslap since this system doesnt account for opcode 12 (which memslap is using)
 Testing the Get using a simple get command in a loop.
 -Get queries: 10K -Time: ~5s -Concurrency : 2
 Get are also limited by number of connections.
 
 
# Future:
1. Use CAS to allow for get/set synchronisation.
2. Distributed servers
3. Have more systematic error handling mechanism (logging to files etc.)
4. One problem that I would like to fix is:
If two client request for the same key and it doesn't exist in memcache, then they both fetch the key from the DB
and then store it in the memcache. One way of solving this would be to store a promise in the cache,
if the client that queries doesn't find the key in the cache. This way the next client that queries will receive the promise,
that will be fulfilled when the previous client puts the value of the key in the cache.




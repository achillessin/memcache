import net from 'net';
import Connection from './connection.js';
import config from '../config.js';

//server class
export default class Server {
  constructor(options) {
    options = options ? options : {};
    this.host = options.host ? options.host : config.host;
    this.port = options.port ? options.port : config.port;
    this.maxKeySize = options.maxKeySize  ? options.maxKeySize : config.permissibleMaxKeySize;
    this.maxValueSize = options.maxValueSize ? options.maxValueSize : config.permissibleMaxValueSize;
    this.tcpServer = null;
    this.connections = [];

    if(this.maxKeySize > config.permissibleMaxKeySize) {
      throw new Error('maxKeySize is larger than the permitted value of:', config.permissibleMaxKeySize);
    }
    if(this.maxValueSize > config.permissibleMaxValueSize) {
      throw new Error('maxValueSize is larger than the permitted value of:', config.permissibleMaxValueSize);
    }
    this.tcpServer = null;
  }

  start() {
    if(this.tcpServer != null) {
      console.info('Memcache server already running');
      return;
    }
    this.tcpServer = net.createServer();
    this.tcpServer.maxConnections = config.maxConnections;
    this.tcpServer
      .on('listening', () => {
        console.info('Server: listening on:', this.tcpServer.address());
      })
      .on('connection', (socket) => {
        console.info('Opened socket connection on :', socket.address(), 'for remote address: ', socket.remoteAddress);
        let connection = new Connection(socket, {maxKeySize: this.maxKeySize, maxValueSize: this.maxValueSize});
        connection.on('close', () => {
          console.log('Closing connection..');
          let index = this.connections.indexOf(connection);
          console.log('**** Total Connections:', this.connections.length);
          if(index >= 0) {
            this.connections.splice(index, 1);
          }
        });
        this.connections.push(connection);
      })
      .on('close', (err) => {
        if (err) {
          console.error(`Error closing memcache server on port: ${this.port}, host: ${this.host}`);
        } else {
          console.error(`Closed memcache server on port: ${this.port}, host: ${this.host}`);
        }
        this.tcpServer = null;
      })
      .on('error', (error) => {
        console.error('Error:', error);
      });
    this.tcpServer.listen(this.port, this.host);
  }

  stop() {
    if (this.tcpServer != null) {
      this.tcpServer.close();
    }
    this.tcpServer = null;
  }
}

import parse from '../utils/request-parser.js';
import events from 'events';
import BufferList from 'bl';

export default class Connection extends events.EventEmitter{
  constructor() {
    super();
    this.requestBuffer = new BufferList();
  }

  init(socket) {
    socket.on('data', (data) => {
      this.requestHandler(data);
    }).on('close', () => {
      this.emit('close');
    });
  }

  requestHandler(dataBuffer) {
    let request = parse(this.addToBuffer(dataBuffer));
    while(request) {
      this.handleRequest(request);
      this.requestBuffer = this.requestBuffer.slice(request.header.totalBodyLength + 24);
      request = parse(this.requestBuffer);
    }
  }

  addToBuffer(newBuffer) {
    this.requestBuffer.append(newBuffer);
    return this.requestBuffer;
  }

  handleRequest(request) {
    console.info('Handling request: ', request);
  }
}
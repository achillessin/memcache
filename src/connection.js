import parse from '../utils/request-parser.js';
import events from 'events';
import BufferList from 'bl';
import lruCache from './cache.js';
import {headerToBuffer, getCommand, errors} from '../utils/opcodes.js';
import Record from './record.js';
import config from '../config.js';


export default class Connection extends events.EventEmitter {
  constructor(socket, options) {
    super();
    if (!options.maxKeySize || !options.maxValueSize) {
      throw new Error('Invalid parameters: Both maxKeySize and maxValueSize must be defined.');
    }
    this.maxKeySize = options.maxKeySize;
    this.maxValueSize = options.maxValueSize;
    this.tcpServer = null;
    this.connections = [];
    this.totalRequests = 0;

    if (this.maxKeySize > config.permissibleMaxKeySize) {
      throw new Error('maxKeySize is larger than the permitted value of:', config.permissibleMaxKeySize);
    }
    if (this.maxValueSize > config.permissibleMaxValueSize) {
      throw new Error('maxValueSize is larger than the permitted value of:', config.permissibleMaxValueSize);
    }

    this.requestBuffer = new BufferList();
    this.socket = socket.on('data', (data) => {
      this.messageHandler(data);
    }).on('close', () => {
      this.emit('close');
    }).on('error', (error) => {
      console.log('Error in connection: ', error);
    })
  }

  addToBuffer(newBuffer) {
    this.requestBuffer.append(newBuffer);
    return this.requestBuffer;
  }

  messageHandler(dataBuffer) {
    let request = parse(this.addToBuffer(dataBuffer));
    while (request) {
      this.requestBuffer = new BufferList(this.requestBuffer.slice(request.header.totalBodyLength + 24));
      let responseBuffer = this.requestHandler(request);
      this.sendResponse(responseBuffer);
      request = parse(this.requestBuffer);
    }
  }

  requestHandler(request) {
    console.info('Handling request: ', request);
    let checkRequestStatus = this.checkRequest(request);
    if (checkRequestStatus) {
      console.error('Error in request header:', checkRequestStatus);
      let error = checkRequestStatus.error;
      return this.makeResponseBuffer(request.header, null, error.message, null, error.code);
    }
    let command = getCommand(request.header.opcode);
    let responseBuffer = null;
    let record;
    switch (command) {
      case 'Get':
        record = lruCache.get(request.key.toString());
        if (record) {
          responseBuffer = this.makeResponseBuffer(request.header, null, record.value, record.extras.flags, errors.NO_ERROR.code);
        } else {
          responseBuffer = this.makeResponseBuffer(request.header, null, errors.KEY_NOT_FOUND.message, null, errors.KEY_NOT_FOUND.code);
        }
        break;
      case 'Set':
        record = new Record(request.value, request.extras);
        lruCache.set(request.key.toString(), record);
        responseBuffer = this.makeResponseBuffer(request.header, null, null, null, errors.NO_ERROR.code);
        break;
      default:
        console.log('Unknown command request made.');
        responseBuffer = this.makeResponseBuffer(request.header, null, errors.UNKNOWN_COMMAND.message, null, errors.UNKNOWN_COMMAND.code);
    }
    return responseBuffer;
  }

  checkRequest(request) {
    if (request.header.keyLength > this.maxKeySize) {
      return {error: errors.INVALID_ARGUMENTS};
    }
    if ((request.header.totalBodyLength - request.header.extrasLength - request.header.keyLength)
      > this.maxValueSize) {
      return {error: errors.VALUE_TOO_LARGE};
    }

    let returnError = null;
    let command = getCommand(request.header.opcode);
    switch (command) {
      case 'Get':
        if (request.header.keyLength === 0 || (request.header.totalBodyLength !== request.header.keyLength)) {
          returnError = {error: errors.INVALID_ARGUMENTS}
        }
        break;
      case 'Set':
        if (request.header.extrasLength === 0 || request.header.keyLength === 0) {
          returnError = {error: errors.INVALID_ARGUMENTS};
          break;
        }
    }
    return returnError;
  }

  createBuffer(val) {
    if (!val) {
      return null;
    }
    let buffer = Buffer.isBuffer(val) ? val : new Buffer(val);
    return buffer;
  }

  makeResponseBuffer(requestHeader, key, value, extras, status) {
    let keyBuffer = this.createBuffer(key);
    let valueBuffer = this.createBuffer(value);
    let extrasBuffer = this.createBuffer(extras);

    let valueLength = valueBuffer ? valueBuffer.length : 0;
    let header = {};
    header.magic = 0x81;
    header.opcode = requestHeader.opcode;
    header.keyLength = keyBuffer ? keyBuffer.length : 0;
    header.extrasLength = extrasBuffer ? extrasBuffer.length : 0;
    header.totalBodyLength = header.keyLength + header.extrasLength + valueLength;
    header.dataType = requestHeader.dataType;
    header.opaque = requestHeader.opaque;
    header.cas = requestHeader.cas;
    header.status = status;
    let buffer = new Buffer(24 + header.keyLength + header.extrasLength + valueLength);

    headerToBuffer(header).copy(buffer);
    if (extrasBuffer) {
      extrasBuffer.copy(buffer, 24)
    }
    if (keyBuffer) {
      keyBuffer.copy(buffer, 24 + header.extrasLength);
    }
    if (valueBuffer) {
      valueBuffer.copy(buffer, 24 + header.extrasLength + header.keyLength);
    }
    return buffer;
  }

  sendResponse(response) {
    this.socket.write(response, () => {
      console.log('Sent response no:', this.totalRequests);
      this.totalRequests++;
    });
  }
}
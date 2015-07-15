//headers
function bufferToHeader(buf) {
  if (!buf) {
    return {};
  }
  return {
    magic:           buf.readUInt8(0),
    opcode:          buf.readUInt8(1),
    keyLength:       buf.readUInt16BE(2),
    extrasLength:    buf.readUInt8(4),
    dataType:        buf.readUInt8(5),
    vbucketId:       buf.readUInt16BE(6),
    totalBodyLength: buf.readUInt32BE(8),
    opaque:          buf.readUInt32BE(12),
    cas:             buf.slice(16, 24)
  };
}

function headerToBuffer(header) {
  var headerBuf = new Buffer(24);
  headerBuf.fill();
  headerBuf.writeUInt8(header.magic, 0);
  headerBuf.writeUInt8(header.opcode, 1);
  headerBuf.writeUInt16BE(header.keyLength, 2);
  headerBuf.writeUInt8(header.extrasLength, 4);
  headerBuf.writeUInt8(header.dataType || 0, 5);
  headerBuf.writeUInt16BE(header.status || 0, 6);
  headerBuf.writeUInt32BE(header.totalBodyLength, 8);
  headerBuf.writeUInt32BE(header.opaque || 0, 12);
  if (header.cas) {
    header.cas.copy(headerBuf, 16);
  } else {
    headerBuf.fill('\0', 16);
  }
  return headerBuf;
}

//opcodes
let commandOpcodes = {
  "0": 'Get',
  "1": 'Set'
};

function getCommand(opcode) {
  if(opcode in commandOpcodes) {
    return commandOpcodes[opcode];
  }
  return null;
}

//errors
let errors = {
  'NO_ERROR': {code: 0x000, message: 'No error'},
  'KEY_NOT_FOUND': {code: 0x0001, message: 'Key not found'},
  'KEY_EXISTS': {code: 0x0002, message: 'Key exists'},
  'VALUE_TOO_LARGE': {code: 0x0003, message: 'Value too large'},
  'INVALID_ARGUMENTS': {code: 0x0004, message: 'Invalid arguments'},
  'ITEM_NOT_STORED': {code: 0x0005, message: 'Item not stored'},
  'BUCKET_ANOTHER_SERVER': {code: 0x0007, message: 'The vbucket belongs to another server'},
  'UNKNOWN_COMMAND': {code: 0x0081, message: 'Unknown command'},
  'OUT_OF_MEMORY': {code: 0x0082, message: 'Out of memory'},
  'INTERNAL_ERROR': {code: 0x0084, message: 'Internal error'}
};


export {bufferToHeader, headerToBuffer, getCommand, errors};
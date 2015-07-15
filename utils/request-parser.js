import {bufferToHeader, getCommand} from './opcodes.js';

export default function parse(buffer) {
  if (buffer.length < 24) {
    return false;
  }
  //header
  let header = bufferToHeader(buffer);
  console.info('Header parsed:', header);
  if (buffer.length < header.totalBodyLength + 24) {
    return false;
  }
  //command
  let command = getCommand(header.opcode);

  //parse
  let extrasBuffer, keyBuffer, valueBuffer;
  let extras = {flags: null, expiry: null};
  let bodyStart = 24;
  extrasBuffer = buffer.slice(bodyStart, bodyStart + header.extrasLength);
  if(extrasBuffer && header.extrasLength > 0) {
    extras.flags = extrasBuffer.slice(0, 4);
    if(header.extrasLength > 4) {
      extras.expiry = extrasBuffer.slice(4, 8)
    }
  }
  keyBuffer = buffer.slice(bodyStart + header.extrasLength, bodyStart + header.extrasLength + header.keyLength);
  valueBuffer = buffer.slice(bodyStart + header.extrasLength + header.keyLength, bodyStart + header.totalBodyLength);

  console.log('Request: ', keyBuffer.toString(), valueBuffer.toString(), extrasBuffer.toString());
  return {header: header, key: keyBuffer, value: valueBuffer, extras: extras};
}
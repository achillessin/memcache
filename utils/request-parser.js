import {bufferToHeader, getCommand} from './opcodes.js';

export default function parse(buffer) {
  if(buffer.length < 24) {
    return false;
  }
  //header
  let header = bufferToHeader(buffer);
  console.debug('Header parsed:', header);
  if(buffer.length < header.totalBodyLength + 24) {
    return false;
  }
  //command
  let command = getCommand(header.opcode);
  if(!command) {
    console.error(`Unrecognized command: ${header.opcode}`);
    return false;
  }
  //parse
  let extras, key, value;
  let bodyStart = 24;
  extras = buffer.slice(bodyStart, bodyStart + header.extrasLength);
  key = buffer.slice(bodyStart + header.extrasLength, bodyStart + header.extrasLength + header.keyLength);
  if(command === 'Set') {
    value = buffer.slice(bodyStart + header.extrasLength + header.keyLength, bodyStart + header.totalBodyLength);
  }
  return {header: header, key: key, value: value, extras: extras};
}
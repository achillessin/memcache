import Server from './src/server.js';
import minimist from 'minimist';

let argumentMap = minimist(process.argv.slice(2));
console.log('Arguments:', argumentMap);
let server = new Server(argumentMap);
server.start();
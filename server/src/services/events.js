const EventEmitter = require('events');

// Singleton event emitter for SSE pub/sub
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(200); // Support many concurrent sessions

module.exports = { eventEmitter };

process.env.NODE_ENV = 'test';

const { default: IORedis } = await import('ioredis');
const { Worker } = await import('bullmq');

// Override IORedis connection to be a no-op
IORedis.prototype.connect = function() {
  console.log("Mocked IORedis.prototype.connect called!");
  return Promise.resolve();
};

// Also stub out Worker prototype connect/start methods if needed
Worker.prototype.run = function() {
  console.log("Mocked Worker.prototype.run called!");
  return Promise.resolve();
};

const { server } = await import('../server.js');
console.log("Successfully imported server.js!");
process.exit(0);

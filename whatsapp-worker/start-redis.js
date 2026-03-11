const { RedisMemoryServer } = require('redis-memory-server');

const redisServer = new RedisMemoryServer({
  instance: {
    port: 6379
  }
});

redisServer.getHost().then(host => {
  redisServer.getPort().then(port => {
    console.log(`✅ Servidor Redis en memoria iniciado en redis://${host}:${port}`);
  });
}).catch(err => {
  console.error('❌ Error iniciando Redis en memoria:', err);
});

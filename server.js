const logger = require('./config/logger');
const app = require('./app');

let server = app.listen(env.PORT, () => {
  logger.info({ apiModule: "server", apiHandler: "server.js" }, `Listening to port ${env.PORT}`);
});

const unexpectedErrorHandler = (error) => {
  logger.error({ apiModule: "server", apiHandler: "server.js" }, error);
};
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info({ apiModule: "server", apiHandler: "server.js" }, 'SIGTERM received');
  if (server) {
    server.close();
  }
});
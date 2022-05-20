const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception! Shutting down');
  process.exit(1);
});

dotenv.config({
  path: './config.env',
});
const app = require('./app');

console.log(process.env.NODE_ENV);

const connString = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(connString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('connection successful'));

// Start the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection! Shutting down');
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM Received! Shutting down');
  server.close(() => console.log('Process terminated'));
});

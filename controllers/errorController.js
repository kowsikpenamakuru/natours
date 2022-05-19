const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid value for ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate value (${value}). Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const violatedFields = Object.values(err.errors).map(
    (error) => error.message
  );
  const message = `Invalid input data: ${violatedFields.join(
    '; '
  )}. Please follow the constraints`;
  return new AppError(message, 400);
};

const handleJSONWebTokenError = () =>
  new AppError('Invalid token. Please login again', 401);

const handleTokenExpiredError = () =>
  new AppError('Login Expired. Please login again', 401);

const sendErrorDev = function (err, req, res) {
  // API error response for dev website
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // View error response for dev website
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = function (err, req, res) {
  // API Error response for prod website
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong',
    });
  }

  // View error response for prod website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  res.status(500).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'internal server error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJSONWebTokenError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, req, res);
  }
};

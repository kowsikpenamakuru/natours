const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const expmongosanitize = require('express-mongo-sanitize');
const xssclean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compressor = require('compression');
const cors = require('cors');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingController = require('./controllers/bookingController');

const AppError = require(`./utils/appError`);
const errorHandler = require('./controllers/errorController');

const app = express();

// Global Middlewares

// Implement CORS; Access-Control-Allow_Origin:  *
app.use(cors());
app.options('*', cors());

// trust proxies
app.enable('trust proxy');

// initialize pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers on the response object
app.use(helmet());

// Development logging of the request received at server
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMilliseconds: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour',
});

app.use('/api', limiter);

// Webhook endpoint for Stripe
app.use(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json());

// urlencoded parser, reading form data into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// cookie parser
app.use(cookieParser());

// Data sanitization agains NoSQL injections - breaks the syntax
app.use(expmongosanitize());

// Prevent XSS through xss-clean - breaks the syntax
app.use(xssclean());

// HPP - HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: ['ratingsAverage', 'duration', 'maxGroupSize', 'price'],
  })
);

// Response compressor
app.use(compressor());

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Unimplemented routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandler);
module.exports = app;

// Route Handlers
/* app.get('/api/v1/tours', getAllTours);
app.get('/api/v1/tours/:id', getTour);
app.post('/api/v1/tours', createTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour); */

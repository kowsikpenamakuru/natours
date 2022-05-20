const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${tour._id}&user=${
    //   req.user.id
    // }&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
        },
      },
    ],
  });
  // 3. Create session as response
  res.status(200).json({
    status: 'success',
    data: {
      session,
    },
  });
});

/* exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
}); */

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  console.log(session.customer_email);
  const user1 = await User.find({ email: session.customer_email });
  const user = await User.find({ email: session.customer_email })._id;
  const price = session.amount_total / 100;
  console.log('=============================');
  console.log(
    `tour is ${tour}; user is ${user}; user1 is ${user1}; price is ${price}`
  );
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  console.log(req.body);
  const signature = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOKS_SECRET
    );

    if (event.type === 'checkout.session.completed')
      createBookingCheckout(event.data.object);

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook error: ${err}`);
  }
};

exports.createBooking = handlerFactory.createOne(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.getAllBookings = handlerFactory.getAll(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);

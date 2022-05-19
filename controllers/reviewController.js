const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const handlerFactory = require('./handlerFactory');

exports.setTourAndIds = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (req.body.tour || req.params.tourId) {
    req.body.tour = req.params.tourId ? req.params.tourId : req.body.tour;
  }
  req.body.user = req.user._id;
  next();
});

exports.getReviews = handlerFactory.getAll(Review);
exports.getReview = handlerFactory.getOne(Review); // api/v1/tours/tourId/reviews/reviewId
exports.createReview = handlerFactory.createOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);

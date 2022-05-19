const express = require('express');

const reviewController = require(`./../controllers/reviewController`);
const authController = require(`./../controllers/authController`);

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

// Bug in the above code. Admin cannot create a review even if he took the tour but admin can delete their review. How can admin delete their review without being able to create a tour?
// Bug in above code. Any user can now mutate a review as per above code

module.exports = router;

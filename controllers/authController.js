const jswt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('./../utils/email');

const generateJWTToken = function (id) {
  return jswt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendTokenInResponse = function (user, statusCode, res) {
  const jwtoken = generateJWTToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  cookieOptions.secure = process.env.NODE_ENV === 'production' ? true : false;
  res.cookie('jwt', jwtoken, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    jwtoken,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  newUser.password = undefined;

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  sendTokenInResponse(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and passwords exist
  if (!email || !password) {
    return next(new AppError('Please provide both email and password', 404));
  }

  // 2. Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  // 3. If everything is okay, send token to client
  user.password = undefined; // removing password field in JSON response
  sendTokenInResponse(user, 201, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token = '';
  // 1. Check if there is a token in the received request
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(new AppError('Please login to access the resource', 401));

  // 2. Verify the token received from header for tampering or expiration
  const decodedPayload = await promisify(jswt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // 3. Check if user still exists
  const currUser = await User.findById(decodedPayload.id);
  if (!currUser) {
    return next(
      new AppError('The user to whom the token belongs doesnt exist', 401)
    );
  }

  // 4. Check if user has changed their password
  if (currUser.changedPasswordAfter(decodedPayload.iat))
    return next(
      new AppError(
        'Password recently changed. Login required after changing password',
        401
      )
    );

  req.user = currUser;
  res.locals.user = currUser; // to use in pug templates
  next();
});

// only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  let token = '';
  // 1. Check if there is a token in the received request cookies
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;
      // 2. Verify the token received from header for tampering or expiration
      const decodedPayload = await promisify(jswt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // 3. Check if user still exists
      const currUser = await User.findById(decodedPayload.id);
      if (!currUser) {
        return next();
      }

      // 4. Check if user has changed their password
      if (currUser.changedPasswordAfter(decodedPayload.iat)) return next();

      // There is a logged in user
      res.locals.user = currUser;
      return next();
    } catch (e) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Check if email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('user does not exist for the entered email', 404));

  // 2. generate random reset confirmation token
  const resetToken = user.generatePasswordRestToken();
  await user.save({ validateBeforeSave: false });

  // 3. send reset confirmation email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'confirmation email for password reset sent',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending email. Please try again!'));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  // Fetch users who have the hashedtoken shared in the url on their document and the user whose token is not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // 2. If the token has not expired, and there is user, set the new password
  if (!user)
    return next(new AppError('Reset link has expired. please try again', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property of the user

  // 4. Log the user in
  sendTokenInResponse(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const {
    currPassword,
    password: newPassword,
    passwordConfirm: newPassConfirm,
  } = req.body;

  // 1. Get user from the collection
  const user = await User.findById(req.user._id).select('+password');

  // 2. Verify current password
  if (!(await user.checkPassword(currPassword, user.password))) {
    return next(
      new AppError('You have entered an incorrect current password', 401)
    );
  }

  // 3. Update password
  user.password = newPassword;
  user.passwordConfirm = newPassConfirm;
  await user.save();

  // 4. log user in, send JWT
  sendTokenInResponse(user, 201, res);
});

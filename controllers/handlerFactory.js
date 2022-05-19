const catchAsync = require('../utils/catchAsync');
const APPError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new APPError('document does not exist', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new APPError('document does not exist', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newdoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newdoc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(new APPError('document does not exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // hack for accommodating getAllReviews under the same handlerFactory
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // console.log(req.query);
    const docFeatures = new APIFeatures(Model.find(filter), req.query);
    docFeatures.filter().sort().limit().paginate();
    const docs = await docFeatures.query;
    res.status(200).json({
      status: 'success',
      length: docs.length,
      data: {
        data: docs,
      },
    });
  });

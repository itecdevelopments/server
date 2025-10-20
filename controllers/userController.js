const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Region = require("../models/regionModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError("Use /updateMyPassword to update your password.", 400)
    );

  const filteredBody = filterObj(
    req.body,
    "username",
    "email",
    "role",
    "region"
  );
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

exports.createUser = (req, res) => {
  res.status(400).json({
    status: "error",
    message: "Use /signup instead of this route.",
  });
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().populate("region", "id name code"); // Only include 'id' and 'name' from Region
  console.log(users);
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("No user found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.region) {
    const regionNameOrCode = req.body.region;

    const regionDoc = await Region.findOne({
      $or: [{ name: regionNameOrCode }, { code: regionNameOrCode }],
    });

    if (!regionDoc) {
      return next(new AppError(`Invalid region: ${regionNameOrCode}`, 400));
    }

    req.body.region = regionDoc._id;
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("region"); // 👈 populate after update

  if (!user) return next(new AppError("No user found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    httpOnly: true,
  });

  res.status(204).json({
    status: "success",
    message: "User deleted and logged out successfully",
    data: null,
  });
});

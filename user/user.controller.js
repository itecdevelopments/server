const User = require("./user.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Region = require("../customer/region.model");

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


exports.createUser = (req, res) => {
  res.status(400).json({
    status: "error",
    message: "Use /signup instead of this route.",
  });
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
    .populate("region", "id name code createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();


  res.status(200).json({
    status: "success",
    results: users.length,
    users: users,
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

exports.adminUpdateUser = catchAsync(async (req, res, next) => {
  const allowedFields = ["name", "username", "password", "passwordConfirm", "region"];
  const updateData = filterObj(req.body, ...allowedFields);
  console.log("Update Data:", updateData);

  /* ------------------------ Validate Username Uniqueness ------------------------ */
  if (updateData.username) {
    const exists = await User.findOne({
      username: updateData.username.toLowerCase(),
      _id: { $ne: req.params.id }
    });

    if (exists) {
      return next(new AppError("Username already taken!", 400));
    }
  }

  /* ---------------- Region Validation (NO ObjectId allowed) ---------------- */
  if (updateData.region) {
    const regionInput = updateData.region.trim();

    // Reject any ObjectId-looking string
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(regionInput);
    if (isObjectId) {
      return next(new AppError("Region must be region NAME or CODE — not MongoDB _id", 400));
    }

    const regionDoc = await Region.findOne({
      $or: [{ name: regionInput }, { code: regionInput }]
    });

    if (!regionDoc) {
      return next(new AppError(`Invalid region: ${regionInput}`, 400));
    }

    updateData.region = regionDoc._id;
  }

  /* --------------------------- Password Update Section -------------------------- */
  let updatedUser;

  if (updateData.password || updateData.passwordConfirm) {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) return next(new AppError("User not found", 404));

    if (!updateData.password || !updateData.passwordConfirm) {
      return next(new AppError("Provide password and passwordConfirm", 400));
    }

    user.name = updateData.name || user.name;
    user.username = updateData.username || user.username;
    user.region = updateData.region || user.region;

    user.password = updateData.password;
    user.passwordConfirm = updateData.passwordConfirm;

    await user.save();
    updatedUser = await user.populate("region", "name code");
  } else {
    updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate("region", "name code");
  }

  if (!updatedUser)
    return next(new AppError("No user found with that ID", 404));

  updatedUser.password = undefined;

  res.status(200).json({
    status: "success",
    message: "User updated successfully.",
    data: { user: updatedUser }
  });
});



exports.deleteUser = catchAsync(async (req, res, next) => {
  // const user = await User.findByIdAndDelete(req.params.id);
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    message: "User deleted and logged out successfully",
    data: null,
  });
});
